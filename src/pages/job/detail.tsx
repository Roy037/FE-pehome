import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Skeleton } from 'antd';
import {
    ApartmentOutlined,
    ArrowLeftOutlined,
    BankOutlined,
    CalendarOutlined,
    CheckSquareFilled,
    ClockCircleOutlined,
    CloseSquareFilled,
    EnvironmentOutlined,
    FlagOutlined,
    LaptopOutlined,
    RiseOutlined,
    ShareAltOutlined,
    StarFilled,
    TeamOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { sfIn } from 'spring-filter-query-builder';
import { callCheckApplied, callFetchJob, callFetchJobById, callGetSubscriberSkills } from '@/config/api';
import { useRequest } from '@/config/use-request';
import { bannerBackground } from '@/config/assets';
import {
    COMPANY_TYPE_LIST,
    EMPLOYMENT_TYPE_LIST,
    LEVEL_LIST,
    WORK_MODE_LIST,
    companyPath,
    formatDate,
    formatSalary,
    getCityName,
    labelOf,
    openJobsFilter,
    timeAgo,
} from '@/config/utils';
import { useAppSelector, useIsEmployer } from '@/redux/hooks';
import { AuthLink, useAuthModal } from '@/components/client/auth';
import { IJob, ISkill } from '@/types/backend';
import ApplyModal from '@/components/client/modal/apply.modal';
import ReportJobModal from '@/components/client/modal/report.job.modal';
import ShareModal from '@/components/client/modal/share.modal';
import MapEmbed, { isMapEmbedUrl } from '@/components/client/map-embed';
import SocialLinks from '@/components/client/company-social';
import VerifiedBadge from '@/components/client/verified-badge';
import { useAccountModal } from '@/components/client/modal/manage.account';
import RichDescription from '@/components/client/rich-description';
import CompanyLogo from '@/components/client/card/company-logo';
import { MiniJob, jobTags } from '@/components/client/card/job.card';
import SaveJobButton from '@/components/client/save-job.button';
import CompanyReviews from '@/components/client/reviews';
import { RotatingBadge, StatePanel } from '@/components/client/decor';
import ui from '@/styles/client.module.scss';
import d from '@/styles/detail.module.scss';

const SkillMatch = ({ skills }: { skills: ISkill[] }) => {
    const openAccount = useAccountModal();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const subscriber = useRequest(() => (isAuthenticated ? callGetSubscriberSkills() : null), [isAuthenticated]);
    if (!skills.length) return null;

    let body: React.ReactNode;
    if (!isAuthenticated) {
        body = (
            <>
                <p className={d.cardNote}>Đăng nhập để so sánh kỹ năng của bạn với yêu cầu của vị trí này.</p>
                <AuthLink mode="login" className={ui.btnPrimarySm}>
                    Đăng nhập
                </AuthLink>
            </>
        );
    } else if (subscriber.loading) {
        body = <Skeleton active paragraph={{ rows: 2 }} title={false} />;
    } else {
        const mine = new Set((subscriber.data?.skills ?? []).map(skill => String(skill.id)));
        if (!mine.size) {
            body = (
                <>
                    <p className={d.cardNote}>Thêm kỹ năng của bạn để xem bạn phù hợp với vị trí này đến đâu.</p>
                    <button type="button" className={ui.btnPrimarySm} onClick={() => openAccount('email-by-skills')}>
                        Thêm kỹ năng
                    </button>
                </>
            );
        } else {
            const have = skills.filter(skill => mine.has(String(skill.id)));
            const missing = skills.filter(skill => !mine.has(String(skill.id)));
            body = (
                <>
                    <div className={d.matchRow}>
                        <CheckSquareFilled className={d.matchHave} aria-hidden="true" />
                        <div>
                            <strong>{have.length} kỹ năng bạn đã có</strong>
                            <span>{have.map(skill => skill.name).join(', ') || 'Chưa có kỹ năng trùng khớp'}</span>
                        </div>
                    </div>
                    <div className={d.matchRow}>
                        <CloseSquareFilled className={d.matchMissing} aria-hidden="true" />
                        <div>
                            <strong>{missing.length} kỹ năng còn thiếu</strong>
                            <span>
                                {missing.map(skill => skill.name).join(', ') || 'Bạn đáp ứng đủ kỹ năng yêu cầu'}
                            </span>
                        </div>
                    </div>
                    <button type="button" className={d.matchLink} onClick={() => openAccount('email-by-skills')}>
                        Cập nhật kỹ năng của bạn
                    </button>
                </>
            );
        }
    }
    return (
        <section className={`${d.card} reveal`} aria-labelledby="match-title">
            <h2 id="match-title">Kỹ năng phù hợp với bạn</h2>
            {body}
        </section>
    );
};

const ClientJobDetailPage = () => {
    const location = useLocation();
    const params = useParams();
    const id = new URLSearchParams(location.search).get('id') || params.id;
    const [applyOpen, setApplyOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const openAuth = useAuthModal();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const isEmployer = useIsEmployer();
    const reportJob = () => (isAuthenticated ? setReportOpen(true) : openAuth('login'));
    const [applied, setApplied] = useState(false);
    const [summary, setSummary] = useState<{ average: number; total: number } | null>(null);
    const request = useRequest(() => (id && /^\d+$/.test(id) ? callFetchJobById(id) : null), [id]);
    const job = request.data;

    useEffect(() => {
        setApplied(false);
        if (!isAuthenticated || !id || !/^\d+$/.test(id)) return;
        let ignore = false;
        (async () => {
            try {
                const res = await callCheckApplied(id);
                if (!ignore) setApplied(Boolean(res?.data?.applied));
            } catch {}
        })();
        return () => {
            ignore = true;
        };
    }, [id, isAuthenticated]);

    const similar = useRequest(() => {
        if (!job) return null;
        const scope = job.skills?.length
            ? sfIn(
                  'skills.id',
                  job.skills.map(skill => Number(skill.id)),
              ).toString()
            : job.company?.id
              ? `company.id : ${Number(job.company.id)}`
              : null;
        if (!scope) return null;
        return callFetchJob(
            new URLSearchParams({
                page: '1',
                size: '6',
                sort: 'createdAt,desc',
                filter: `${openJobsFilter()} and ${scope} and id ! ${Number(job.id)}`,
            }).toString(),
        );
    }, [job?.id]);
    const similarJobs = (similar.data?.result ?? [])
        .filter((item, index, list) => list.findIndex(other => other.id === item.id) === index)
        .slice(0, 3);

    if (request.loading) {
        return (
            <div className={`${ui.container} ${d.loading}`} aria-busy="true" aria-label="Đang tải việc làm">
                <Skeleton active avatar paragraph={{ rows: 8 }} />
            </div>
        );
    }
    if (!job) {
        return (
            <div className={ui.container}>
                <div className={d.missing}>
                    <StatePanel
                        icon={<BankOutlined />}
                        title={request.error ? 'Chưa thể tải việc làm' : 'Không tìm thấy việc làm'}
                        text={
                            request.error
                                ? 'Vui lòng kiểm tra kết nối và thử lại.'
                                : 'Tin tuyển dụng có thể đã được gỡ hoặc đường dẫn không còn đúng.'
                        }
                        action={
                            <div className={d.missingActions}>
                                <Link className={ui.btnOutline} to="/job">
                                    <ArrowLeftOutlined /> Về danh sách việc làm
                                </Link>
                                {request.error && (
                                    <button type="button" className={ui.btnPrimary} onClick={request.retry}>
                                        Thử lại
                                    </button>
                                )}
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const expired = Boolean(job.endDate && dayjs(job.endDate).isBefore(dayjs()));
    const closed = job.active === false || expired;
    const upcoming = Boolean(job.startDate && dayjs(job.startDate).isAfter(dayjs()));
    const deadline = formatDate(job.endDate);
    const overview = [
        { icon: <RiseOutlined />, label: 'Cấp bậc', value: labelOf(LEVEL_LIST, job.level) },
        {
            icon: <ClockCircleOutlined />,
            label: 'Hình thức làm việc',
            value: labelOf(EMPLOYMENT_TYPE_LIST, job.employmentType),
        },
        { icon: <LaptopOutlined />, label: 'Nơi làm việc', value: labelOf(WORK_MODE_LIST, job.workMode) },
        { icon: <CalendarOutlined />, label: 'Hạn nộp hồ sơ', value: deadline },
        { icon: <EnvironmentOutlined />, label: 'Địa điểm', value: getCityName(job.location) },
        { icon: <WalletOutlined />, label: 'Mức lương', value: formatSalary(job.salary, job.salaryMax) },
        { icon: <TeamOutlined />, label: 'Số lượng tuyển', value: job.quantity > 0 ? `${job.quantity} người` : null },
        {
            icon: <ApartmentOutlined />,
            label: 'Loại hình công ty',
            value: labelOf(COMPANY_TYPE_LIST, job.company?.companyType),
        },
    ].filter(row => row.value);

    return (
        <div className={d.page}>
            <section className={d.banner} style={{ backgroundImage: bannerBackground }} aria-labelledby="job-title">
                <div className={`${ui.container} ${d.bannerInner}`}>
                    <nav className={d.breadcrumb} aria-label="Đường dẫn">
                        <Link to="/">Trang chủ</Link>
                        <span>/</span>
                        <Link to="/job">Việc làm</Link>
                        <span>/</span>
                        <span aria-current="page">Chi tiết</span>
                    </nav>
                    {(closed || upcoming) && (
                        <span className={`${d.statusChip} ${closed ? d.statusClosed : ''}`}>
                            {closed ? 'Đã đóng tuyển dụng' : 'Sắp mở tuyển dụng'}
                        </span>
                    )}
                    <h1 id="job-title" className="enter">
                        {job.name}
                    </h1>
                    {!closed && !upcoming && (
                        <RotatingBadge text="Đang tuyển dụng ✦ Đang tuyển dụng ✦ " className={d.bannerBadge} />
                    )}
                </div>
            </section>

            <div className={`${ui.container} ${d.identity}`}>
                <div className={d.identityMain}>
                    <CompanyLogo
                        name={job.company?.name}
                        logo={job.company?.logo}
                        size={128}
                        className={d.identityLogo}
                    />
                    <div className={d.identityText}>
                        <span className={d.companyLine}>
                            {job.company ? (
                                <Link to={companyPath(job.company)} className={d.companyName}>
                                    {job.company.name}
                                </Link>
                            ) : (
                                <span className={d.companyName}>Nhà tuyển dụng</span>
                            )}
                            <VerifiedBadge approved={job.company?.approved} />
                        </span>
                        <a href="#reviews" className={d.ratingLink}>
                            <StarFilled aria-hidden="true" />
                            {summary?.total ? (
                                <>
                                    {summary.average.toFixed(1)} · {summary.total} đánh giá
                                </>
                            ) : (
                                'Chưa có đánh giá'
                            )}
                        </a>
                        {job.company?.address && (
                            <p className={d.address}>
                                <EnvironmentOutlined aria-hidden="true" /> {job.company.address}
                            </p>
                        )}
                        <div className={ui.tags}>
                            {jobTags(job).map(tag => (
                                <span key={tag} className={ui.tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <SocialLinks company={job.company} />
                    </div>
                </div>
                <div className={d.identitySide}>
                    <button type="button" className={d.reportButton} onClick={reportJob}>
                        <FlagOutlined aria-hidden="true" /> Báo cáo tin
                    </button>
                    <p>
                        Đăng ngày: <strong>{formatDate(job.createdAt) ?? '—'}</strong>
                    </p>
                    <p>
                        Hoạt động gần nhất:{' '}
                        <strong title={formatDate(job.updatedAt ?? job.createdAt) ?? undefined}>
                            {timeAgo(job.updatedAt ?? job.createdAt) ?? '—'}
                        </strong>
                    </p>
                    <div className={d.actions}>
                        <button
                            type="button"
                            className={ui.btnPrimary}
                            disabled={closed || upcoming || applied || isEmployer}
                            onClick={() => {
                                if (!applied) setApplyOpen(true);
                            }}
                        >
                            {expired
                                ? 'Tin tuyển dụng đã hết hạn'
                                : closed
                                  ? 'Tin tuyển dụng đã đóng'
                                  : isEmployer
                                    ? 'Tài khoản nhà tuyển dụng'
                                    : applied
                                      ? 'Đã ứng tuyển'
                                      : upcoming
                                        ? 'Chưa mở ứng tuyển'
                                        : 'Ứng tuyển ngay'}
                        </button>
                        <SaveJobButton jobId={job.id} jobName={job.name} className={d.squareButton} />
                        <button
                            type="button"
                            className={ui.btnIcon}
                            onClick={() => setShareOpen(true)}
                            aria-label="Chia sẻ việc làm"
                        >
                            <ShareAltOutlined />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${ui.container} ${d.layout}`}>
                <div className={d.mainColumn}>
                    <section className={`${d.block} reveal`} aria-labelledby="description-title">
                        <h2 id="description-title">Mô tả công việc</h2>
                        <div className={d.richText}>
                            <RichDescription html={job.description || ''} />
                        </div>
                    </section>
                    {job.company?.id && (
                        <section className={`${d.block} reveal`} id="reviews" aria-labelledby="reviews-title">
                            <h2 id="reviews-title">Đánh giá về {job.company.name}</h2>
                            <CompanyReviews
                                companyId={String(job.company.id)}
                                companyName={job.company.name}
                                onSummary={setSummary}
                            />
                        </section>
                    )}
                </div>
                <aside className={d.sidebar}>
                    <section className={`${d.card} reveal`} aria-labelledby="overview-title">
                        <h2 id="overview-title">Tổng quan công việc</h2>
                        <ul className={d.overview}>
                            {overview.map(row => (
                                <li key={row.label}>
                                    <span aria-hidden="true">{row.icon}</span>
                                    <div>
                                        <span>{row.label}</span>
                                        <strong>{row.value}</strong>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {job.skills?.length > 0 && (
                            <>
                                <h3 className={d.cardSubtitle}>Kỹ năng yêu cầu</h3>
                                <div className={ui.tags}>
                                    {job.skills.map(skill => (
                                        <span key={skill.id} className={d.skillTag}>
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                    {isMapEmbedUrl(job.company?.mapEmbedUrl) && (
                        <section className={`${d.card} reveal`} aria-labelledby="map-title">
                            <h2 id="map-title">Địa điểm làm việc</h2>
                            {job.company?.address && <p className={d.cardNote}>{job.company.address}</p>}
                            <MapEmbed
                                url={job.company?.mapEmbedUrl}
                                title={`Bản đồ văn phòng ${job.company?.name ?? ''}`}
                            />
                        </section>
                    )}
                    <SkillMatch skills={job.skills ?? []} />
                    {similarJobs.length > 0 && (
                        <section className={`${d.card} reveal`} aria-labelledby="similar-title">
                            <h2 id="similar-title">Việc làm tương tự</h2>
                            <ul className={d.miniList}>
                                {similarJobs.map((item: IJob) => (
                                    <MiniJob key={item.id} job={item} />
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
            <ReportJobModal open={reportOpen} onClose={() => setReportOpen(false)} jobId={job.id} jobName={job.name} />
            <ShareModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                kind="job"
                id={job.id}
                title={job.name}
                company={job.company}
                facts={[formatSalary(job.salary, job.salaryMax), getCityName(job.location)]}
                message={`Cơ hội việc làm: ${job.name}${job.company?.name ? ` tại ${job.company.name}` : ''}.\nMức lương: ${formatSalary(job.salary, job.salaryMax)}. Địa điểm: ${getCityName(job.location)}.\nXem chi tiết và ứng tuyển trên itjobs:`}
            />
            <ApplyModal
                isModalOpen={applyOpen}
                setIsModalOpen={setApplyOpen}
                jobDetail={job}
                onApplied={() => setApplied(true)}
            />
        </div>
    );
};

export default ClientJobDetailPage;
