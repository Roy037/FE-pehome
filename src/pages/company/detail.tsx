import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Skeleton } from 'antd';
import {
    ApartmentOutlined,
    ArrowLeftOutlined,
    BankOutlined,
    EnvironmentOutlined,
    FileSearchOutlined,
    GlobalOutlined,
    ShareAltOutlined,
    StarFilled,
} from '@ant-design/icons';
import { callFetchCompanyById, callFetchJob } from '@/config/api';
import { useRequest } from '@/config/use-request';
import { bannerBackground } from '@/config/assets';
import { COMPANY_TYPE_LIST, labelOf, openJobsFilter } from '@/config/utils';
import RichDescription from '@/components/client/rich-description';
import CompanyLogo from '@/components/client/card/company-logo';
import FollowCompanyButton from '@/components/client/follow-company.button';
import { MiniJob } from '@/components/client/card/job.card';
import CompanyReviews from '@/components/client/reviews';
import MapEmbed, { isMapEmbedUrl } from '@/components/client/map-embed';
import SocialLinks from '@/components/client/company-social';
import VerifiedBadge from '@/components/client/verified-badge';
import { StatePanel } from '@/components/client/decor';
import ShareModal from '@/components/client/modal/share.modal';
import ui from '@/styles/client.module.scss';
import d from '@/styles/detail.module.scss';

const ClientCompanyDetailPage = () => {
    const location = useLocation();
    const params = useParams();
    const id = new URLSearchParams(location.search).get('id') || params.id;
    const valid = Boolean(id && /^\d+$/.test(id));
    const [summary, setSummary] = useState<{ average: number; total: number } | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const request = useRequest(() => (valid ? callFetchCompanyById(id!) : null), [id]);
    const jobs = useRequest(
        () =>
            valid
                ? callFetchJob(
                      new URLSearchParams({
                          page: '1',
                          size: '6',
                          sort: 'createdAt,desc',
                          filter: `${openJobsFilter()} and company.id : ${Number(id)}`,
                      }).toString(),
                  )
                : null,
        [id],
    );
    const company = request.data;
    const openJobs = jobs.data?.meta.total ?? 0;

    if (request.loading) {
        return (
            <div className={`${ui.container} ${d.loading}`} aria-busy="true" aria-label="Đang tải hồ sơ công ty">
                <Skeleton active avatar paragraph={{ rows: 8 }} />
            </div>
        );
    }
    if (!company) {
        return (
            <div className={ui.container}>
                <div className={d.missing}>
                    <StatePanel
                        icon={<BankOutlined />}
                        title={request.error ? 'Chưa thể tải hồ sơ công ty' : 'Không tìm thấy công ty'}
                        text={
                            request.error
                                ? 'Vui lòng kiểm tra kết nối và thử lại.'
                                : 'Hồ sơ có thể đã được gỡ hoặc đường dẫn không còn đúng.'
                        }
                        action={
                            <div className={d.missingActions}>
                                <Link className={ui.btnOutline} to="/company">
                                    <ArrowLeftOutlined /> Khám phá công ty
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

    return (
        <div className={d.page}>
            <section
                className={d.banner}
                style={{
                    backgroundImage: company.banner
                        ? `url(${import.meta.env.VITE_BACKEND_URL}/storage/company/${encodeURIComponent(company.banner)}), ${bannerBackground}`
                        : bannerBackground,
                }}
                aria-labelledby="company-title"
            >
                <div className={`${ui.container} ${d.bannerInner}`}>
                    <nav className={d.breadcrumb} aria-label="Đường dẫn">
                        <Link to="/">Trang chủ</Link>
                        <span>/</span>
                        <Link to="/company">Công ty</Link>
                        <span>/</span>
                        <span aria-current="page">Hồ sơ công ty</span>
                    </nav>
                    <span className={d.statusChip}>
                        {openJobs ? `${openJobs} vị trí đang tuyển` : 'Hồ sơ nhà tuyển dụng'}
                    </span>
                    <h1 id="company-title" className="enter">
                        {company.name}
                    </h1>
                </div>
            </section>

            <div className={`${ui.container} ${d.identity}`}>
                <div className={d.identityMain}>
                    <CompanyLogo name={company.name} logo={company.logo} size={128} className={d.identityLogo} />
                    <div className={d.identityText}>
                        <span className={d.companyLine}>
                            <span className={d.companyName}>{company.name}</span>
                            <VerifiedBadge approved={company.approved} />
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
                        {company.address && (
                            <p className={d.address}>
                                <EnvironmentOutlined aria-hidden="true" /> {company.address}
                            </p>
                        )}
                        <SocialLinks company={company} />
                    </div>
                </div>
                <div className={d.identitySide}>
                    <div className={d.actions}>
                        <a href="#company-jobs" className={ui.btnPrimary}>
                            Xem việc làm đang tuyển
                        </a>
                        <FollowCompanyButton
                            companyId={company.id}
                            companyName={company.name ?? 'nhà tuyển dụng'}
                            withLabel
                        />
                        <button
                            type="button"
                            className={ui.btnIcon}
                            onClick={() => setShareOpen(true)}
                            aria-label="Chia sẻ hồ sơ công ty"
                        >
                            <ShareAltOutlined />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${ui.container} ${d.layout}`}>
                <div className={d.mainColumn}>
                    <section className={`${d.block} reveal`} aria-labelledby="about-title">
                        <h2 id="about-title">Giới thiệu công ty</h2>
                        <div className={d.richText}>
                            <RichDescription html={company.description || ''} />
                        </div>
                    </section>
                    <section className={`${d.block} reveal`} id="reviews" aria-labelledby="reviews-title">
                        <h2 id="reviews-title">Đánh giá từ cộng đồng</h2>
                        <CompanyReviews
                            companyId={String(company.id)}
                            companyName={company.name}
                            onSummary={setSummary}
                        />
                    </section>
                </div>
                <aside className={d.sidebar}>
                    <section className={`${d.card} reveal`} aria-labelledby="info-title">
                        <h2 id="info-title">Thông tin công ty</h2>
                        <ul className={d.overview}>
                            <li>
                                <span aria-hidden="true">
                                    <EnvironmentOutlined />
                                </span>
                                <div>
                                    <span>Địa chỉ</span>
                                    <strong>{company.address || 'Chưa cập nhật'}</strong>
                                </div>
                            </li>
                            {company.companyType && (
                                <li>
                                    <span aria-hidden="true">
                                        <ApartmentOutlined />
                                    </span>
                                    <div>
                                        <span>Loại hình</span>
                                        <strong>{labelOf(COMPANY_TYPE_LIST, company.companyType)}</strong>
                                    </div>
                                </li>
                            )}
                            {company.website && (
                                <li>
                                    <span aria-hidden="true">
                                        <GlobalOutlined />
                                    </span>
                                    <div>
                                        <span>Website</span>
                                        <strong>
                                            <a
                                                href={company.website}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow"
                                            >
                                                {company.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </strong>
                                    </div>
                                </li>
                            )}
                            <li>
                                <span aria-hidden="true">
                                    <FileSearchOutlined />
                                </span>
                                <div>
                                    <span>Việc làm đang tuyển</span>
                                    <strong>{jobs.loading ? '…' : `${openJobs} vị trí`}</strong>
                                </div>
                            </li>
                            <li>
                                <span aria-hidden="true">
                                    <StarFilled />
                                </span>
                                <div>
                                    <span>Đánh giá trung bình</span>
                                    <strong>{summary?.total ? `${summary.average.toFixed(1)} / 5` : 'Chưa có'}</strong>
                                </div>
                            </li>
                        </ul>
                    </section>
                    {isMapEmbedUrl(company.mapEmbedUrl) && (
                        <section className={`${d.card} reveal`} aria-labelledby="map-title">
                            <h2 id="map-title">Vị trí văn phòng</h2>
                            {company.address && <p className={d.cardNote}>{company.address}</p>}
                            <MapEmbed url={company.mapEmbedUrl} title={`Bản đồ văn phòng ${company.name ?? ''}`} />
                        </section>
                    )}
                    <section className={`${d.card} reveal`} id="company-jobs" aria-labelledby="company-jobs-title">
                        <h2 id="company-jobs-title">Việc làm đang tuyển</h2>
                        {jobs.loading ? (
                            <Skeleton active paragraph={{ rows: 3 }} title={false} />
                        ) : openJobs === 0 ? (
                            <p className={d.cardNote}>Công ty hiện chưa có vị trí đang tuyển.</p>
                        ) : (
                            <ul className={d.miniList}>
                                {jobs.data?.result.map(job => (
                                    <MiniJob key={job.id} job={job} showCompany={false} />
                                ))}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>
            <ShareModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                kind="company"
                id={company.id}
                title={company.name ?? 'itjobs'}
                company={company}
                facts={company.address ? [company.address] : []}
                message={`Xem hồ sơ công ty ${company.name ?? ''} và các vị trí đang tuyển trên itjobs:`}
            />
        </div>
    );
};

export default ClientCompanyDetailPage;
