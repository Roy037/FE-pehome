import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Rate, Skeleton, Tag } from 'antd';
import {
    BankOutlined,
    CrownOutlined,
    DollarOutlined,
    FileTextOutlined,
    FlagOutlined,
    HeartOutlined,
    MailOutlined,
    PlusOutlined,
    SafetyCertificateOutlined,
    ScheduleOutlined,
    ShoppingOutlined,
    StarOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import CountUp from '@/components/share/count-up';
import dayjs from 'dayjs';
import {
    callFetchAdminStats,
    callFetchAllSavedJobs,
    callFetchCompany,
    callFetchJob,
    callFetchOrders,
    callFetchResume,
    callFetchReviews,
    callFetchSubscriber,
    callFetchUser,
} from '@/config/api';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { ORDER_STATUS, RESUME_STATUS, formatVnd, openJobsFilter } from '@/config/utils';
import { useAppSelector } from '@/redux/hooks';
import { IAdminOrder, IAdminStats, IReview } from '@/types/backend';
import s from '@/styles/admin.module.scss';

interface RecentResume {
    id: number;
    status: string;
    createdAt: string;
    companyName?: string;
    user: { name: string };
    job: { name: string };
}
interface Stat {
    key: string;
    label: string;
    to?: string;
    icon: ReactNode;
    total: number;
    suffix?: string;
    note?: string;
}

const LATEST = 'page=1&size=5&sort=createdAt,desc';
const compactVnd = (value: number) =>
    value >= 1e6 ? `${+(value / 1e6).toFixed(1)}tr` : value >= 1e3 ? `${Math.round(value / 1e3)}k` : String(value);
const monthLabel = (month: string) => `T${Number(month.slice(5))}`;

// plain CSS columns: six numbers do not need a chart library
const Bars = ({
    months,
    values,
    format,
}: {
    months: string[];
    values: number[];
    format: (value: number) => string;
}) => {
    const max = Math.max(...values, 1);
    return (
        <div
            className={s.bars}
            role="img"
            aria-label={months.map((month, i) => `${monthLabel(month)}: ${format(values[i])}`).join(', ')}
        >
            {months.map((month, i) => (
                <div key={month} className={s.bar} title={`${monthLabel(month)}: ${format(values[i])}`}>
                    <span className={s.barValue}>{values[i] ? format(values[i]) : ''}</span>
                    <span className={s.barTrack}>
                        <span
                            className={s.barFill}
                            style={{ height: `${values[i] ? Math.max((values[i] / max) * 100, 4) : 0}%` }}
                        />
                    </span>
                    <span className={s.barLabel}>{monthLabel(month)}</span>
                </div>
            ))}
        </div>
    );
};

const total = (res: PromiseSettledResult<{ data?: { meta: { total: number } } }>) =>
    res.status === 'fulfilled' && res.value.data ? res.value.data.meta.total : undefined;

const DashboardPage = () => {
    const user = useAppSelector(state => state.account.user);
    const permissions = user.role?.permissions ?? [];
    const can = (perm: { apiPath: string; method: string }) =>
        import.meta.env.VITE_ACL_ENABLE === 'false' ||
        permissions.some(p => p.apiPath === perm.apiPath && p.method === perm.method);
    const canUsers = can(ALL_PERMISSIONS.USERS.GET_PAGINATE);
    const canResumes = can(ALL_PERMISSIONS.RESUMES.GET_PAGINATE);
    const canReviews = can(ALL_PERMISSIONS.REVIEWS.GET_PAGINATE);
    const canSavedJobs = can(ALL_PERMISSIONS.SAVED_JOBS.GET_PAGINATE);
    const canSubscribers = can(ALL_PERMISSIONS.SUBSCRIBERS.GET_PAGINATE);
    const canApprove = can(ALL_PERMISSIONS.COMPANIES.APPROVE);
    const canStats = can(ALL_PERMISSIONS.STATS.GET);
    const canOrders = can(ALL_PERMISSIONS.ORDERS.GET_PAGINATE);
    const companyId = user.company?.id;
    const ofCompany = companyId ? ` and company.id : ${companyId}` : '';

    const [stats, setStats] = useState<Stat[]>();
    const [resumes, setResumes] = useState<RecentResume[]>([]);
    const [reviews, setReviews] = useState<IReview[]>([]);
    const [overview, setOverview] = useState<IAdminStats>();
    const [orders, setOrders] = useState<IAdminOrder[]>([]);

    useEffect(() => {
        let ignore = false;
        const none = Promise.reject();
        none.catch(() => undefined);
        Promise.allSettled([
            callFetchJob(`page=1&size=1&filter=${encodeURIComponent(`id > 0${ofCompany}`)}`),
            callFetchJob(`page=1&size=1&filter=${encodeURIComponent(`${openJobsFilter()}${ofCompany}`)}`),
            companyId ? none : callFetchCompany('page=1&size=1'),
            canUsers ? callFetchUser('page=1&size=1') : none,
            canResumes ? callFetchResume(LATEST) : none,
            canResumes ? callFetchResume(`page=1&size=1&filter=${encodeURIComponent("status : 'PENDING'")}`) : none,
            canReviews ? callFetchReviews(LATEST) : none,
            canSavedJobs ? callFetchAllSavedJobs('page=1&size=1') : none,
            canSubscribers ? callFetchSubscriber('page=1&size=1') : none,
            canApprove
                ? callFetchCompany(
                      `page=1&size=1&filter=${encodeURIComponent('approved : false and rejectionReason is null')}`,
                  )
                : none,
            canStats ? callFetchAdminStats() : none,
            canOrders ? callFetchOrders(LATEST) : none,
        ]).then(
            ([
                jobs,
                activeJobs,
                companies,
                users,
                latestResumes,
                pending,
                latestReviews,
                savedJobs,
                subscribers,
                awaiting,
                platform,
                latestOrders,
            ]) => {
                if (ignore) return;
                const ov = platform.status === 'fulfilled' ? platform.value.data : undefined;
                const all: (Stat | undefined)[] = [
                    {
                        key: 'job',
                        label: 'Việc làm',
                        to: '/admin/job',
                        icon: <ScheduleOutlined />,
                        total: total(jobs) ?? 0,
                        note: `${total(activeJobs) ?? 0} đang tuyển`,
                    },
                    companyId
                        ? undefined
                        : {
                              key: 'company',
                              label: 'Công ty',
                              to: '/admin/company',
                              icon: <BankOutlined />,
                              total: total(companies) ?? 0,
                          },
                    canApprove
                        ? {
                              key: 'awaiting',
                              label: 'Nhà tuyển dụng chờ duyệt',
                              to: '/admin/company',
                              icon: <SafetyCertificateOutlined />,
                              total: total(awaiting) ?? 0,
                              note: ov && `${ov.companies.rejected} công ty đã bị từ chối`,
                          }
                        : undefined,
                    canUsers
                        ? {
                              key: 'user',
                              label: 'Người dùng',
                              to: '/admin/user',
                              icon: <TeamOutlined />,
                              total: total(users) ?? 0,
                              note: ov && `${ov.users.candidates} ứng viên · ${ov.users.employers} nhà tuyển dụng`,
                          }
                        : undefined,
                    canResumes
                        ? {
                              key: 'resume',
                              label: 'Hồ sơ ứng tuyển',
                              to: '/admin/resume',
                              icon: <FileTextOutlined />,
                              total: total(latestResumes) ?? 0,
                              note: `${total(pending) ?? 0} chờ xử lý`,
                          }
                        : undefined,
                    canReviews
                        ? {
                              key: 'review',
                              label: 'Đánh giá',
                              to: '/admin/review',
                              icon: <StarOutlined />,
                              total: total(latestReviews) ?? 0,
                          }
                        : undefined,
                    canSavedJobs
                        ? {
                              key: 'saved',
                              label: 'Việc đã lưu',
                              to: '/admin/saved-job',
                              icon: <HeartOutlined />,
                              total: total(savedJobs) ?? 0,
                          }
                        : undefined,
                    canSubscribers
                        ? {
                              key: 'subscriber',
                              label: 'Đăng ký nhận tin',
                              to: '/admin/subscriber',
                              icon: <MailOutlined />,
                              total: total(subscribers) ?? 0,
                          }
                        : undefined,
                    ov && {
                        key: 'revenue',
                        label: 'Doanh thu',
                        icon: <DollarOutlined />,
                        total: ov.revenue.total,
                        suffix: 'đ',
                        note: `${formatVnd(ov.revenue.last30Days)} trong 30 ngày`,
                    },
                    ov && {
                        key: 'premium',
                        label: 'Gói đang hoạt động',
                        icon: <CrownOutlined />,
                        total: ov.users.premium,
                        note: 'ứng viên còn hạn dùng',
                    },
                    ov && {
                        key: 'orders',
                        label: 'Đơn đã thanh toán',
                        icon: <ShoppingOutlined />,
                        total: ov.revenue.paidOrders,
                        note: `${ov.revenue.payingUsers} người đã mua`,
                    },
                    ov && {
                        key: 'reports',
                        label: 'Báo cáo tin chờ xử lý',
                        to: '/admin/job-report',
                        icon: <FlagOutlined />,
                        total: ov.jobs.reports,
                        note: `${ov.jobs.locked} tin đang bị khóa`,
                    },
                ];
                setStats(all.filter((stat): stat is Stat => Boolean(stat)));
                if (latestResumes.status === 'fulfilled')
                    setResumes((latestResumes.value.data?.result ?? []) as unknown as RecentResume[]);
                if (latestReviews.status === 'fulfilled') setReviews(latestReviews.value.data?.result ?? []);
                setOverview(ov);
                if (latestOrders.status === 'fulfilled') setOrders(latestOrders.value.data?.result ?? []);
            },
        );
        return () => {
            ignore = true;
        };
    }, [
        canUsers,
        canResumes,
        canReviews,
        canSavedJobs,
        canSubscribers,
        canApprove,
        canStats,
        canOrders,
        companyId,
        ofCompany,
    ]);

    return (
        <div className={s.dashboard}>
            <header className={s.dashHead}>
                <div>
                    <h1>Tổng quan</h1>
                    <p>
                        {user.company
                            ? `Tuyển dụng và ứng tuyển của ${user.company.name}.`
                            : 'Tình hình tuyển dụng và ứng tuyển mới nhất.'}
                    </p>
                </div>
                <div className={s.dashHeadSide}>
                    {user.company?.approved && (
                        <Link to="/admin/job/upsert" className={s.dashCta}>
                            <PlusOutlined aria-hidden="true" /> Đăng tin tuyển dụng
                        </Link>
                    )}
                    <span className={s.dashDate}>{dayjs().format('DD/MM/YYYY')}</span>
                </div>
            </header>

            <div className={s.statGrid}>
                {stats
                    ? stats.map(stat => {
                          const body = (
                              <>
                                  <span className={s.statIcon} aria-hidden="true">
                                      {stat.icon}
                                  </span>
                                  <span className={s.statLabel}>{stat.label}</span>
                                  <strong className={s.statValue}>
                                      <CountUp end={stat.total} separator="." suffix={stat.suffix} duration={0.8} />
                                  </strong>
                                  {stat.note && <span className={s.statNote}>{stat.note}</span>}
                              </>
                          );
                          return stat.to ? (
                              <Link key={stat.key} to={stat.to} className={s.stat}>
                                  {body}
                              </Link>
                          ) : (
                              <div key={stat.key} className={`${s.stat} ${s.statStatic}`}>
                                  {body}
                              </div>
                          );
                      })
                    : Array.from({ length: 7 }, (_, index) => (
                          <div key={index} className={s.stat}>
                              <Skeleton active paragraph={{ rows: 1 }} />
                          </div>
                      ))}
            </div>

            <div className={s.panels}>
                {overview && (
                    <>
                        <section className={s.panel}>
                            <header>
                                <h2>Doanh thu 6 tháng</h2>
                                <span className={s.panelNote}>{formatVnd(overview.revenue.total)} tổng</span>
                            </header>
                            <Bars
                                months={overview.months.map(m => m.month)}
                                values={overview.months.map(m => m.revenue)}
                                format={compactVnd}
                            />
                            <ul>
                                {overview.revenue.byPlan.map(plan => (
                                    <li key={plan.plan}>
                                        <div>
                                            <strong>Gói {plan.label}</strong>
                                            <span>{plan.orders} lượt mua</span>
                                        </div>
                                        <strong>{formatVnd(plan.amount)}</strong>
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section className={s.panel}>
                            <header>
                                <h2>Người dùng và hồ sơ mới</h2>
                            </header>
                            {(() => {
                                const { total: all, candidates, employers } = overview.users;
                                const pct = (value: number) => (all ? Math.round((value / all) * 100) : 0);
                                return (
                                    <div className={s.ratio}>
                                        <div
                                            className={s.ratioBar}
                                            role="img"
                                            aria-label={`${candidates} ứng viên, ${employers} nhà tuyển dụng`}
                                        >
                                            <span style={{ flex: candidates, background: 'var(--brand)' }} />
                                            <span style={{ flex: employers, background: 'var(--ink, #1D1712)' }} />
                                            <span
                                                style={{
                                                    flex: Math.max(all - candidates - employers, 0),
                                                    background: 'var(--line)',
                                                }}
                                            />
                                        </div>
                                        <p>
                                            <i style={{ background: 'var(--brand)' }} />
                                            Ứng viên {candidates} ({pct(candidates)}%)
                                            <i style={{ background: 'var(--ink, #1D1712)' }} />
                                            Nhà tuyển dụng {employers} ({pct(employers)}%)
                                        </p>
                                    </div>
                                );
                            })()}
                            <p className={s.chartTitle}>Đăng ký mới</p>
                            <Bars
                                months={overview.months.map(m => m.month)}
                                values={overview.months.map(m => m.signups)}
                                format={String}
                            />
                            <p className={s.chartTitle}>Hồ sơ ứng tuyển</p>
                            <Bars
                                months={overview.months.map(m => m.month)}
                                values={overview.months.map(m => m.applications)}
                                format={String}
                            />
                        </section>
                    </>
                )}
                {canOrders && (
                    <section className={s.panel}>
                        <header>
                            <h2>Giao dịch gần nhất</h2>
                        </header>
                        {orders.length ? (
                            <ul>
                                {orders.map(({ order, userName, txnRef }) => (
                                    <li key={txnRef}>
                                        <div>
                                            <strong>{userName}</strong>
                                            <span>
                                                Gói {order.plan.charAt(0) + order.plan.slice(1).toLowerCase()} ·{' '}
                                                {formatVnd(order.amount)}
                                            </span>
                                        </div>
                                        <div className={s.rowMeta}>
                                            <Tag color={ORDER_STATUS[order.status].color}>
                                                {ORDER_STATUS[order.status].label}
                                            </Tag>
                                            <time>{dayjs(order.createdAt).format('DD/MM/YYYY')}</time>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có giao dịch nào." />
                        )}
                    </section>
                )}
                {canResumes && (
                    <section className={s.panel}>
                        <header>
                            <h2>Hồ sơ mới nhất</h2>
                            <Link to="/admin/resume">Xem tất cả</Link>
                        </header>
                        {resumes.length ? (
                            <ul>
                                {resumes.map(resume => (
                                    <li key={resume.id}>
                                        <div>
                                            <strong>{resume.user?.name}</strong>
                                            <span>
                                                {resume.job?.name}
                                                {resume.companyName ? ` · ${resume.companyName}` : ''}
                                            </span>
                                        </div>
                                        <div className={s.rowMeta}>
                                            <Tag color={RESUME_STATUS[resume.status]?.color}>
                                                {RESUME_STATUS[resume.status]?.label ?? resume.status}
                                            </Tag>
                                            <time>{dayjs(resume.createdAt).format('DD/MM/YYYY')}</time>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hồ sơ ứng tuyển nào." />
                        )}
                    </section>
                )}
                {canReviews && (
                    <section className={s.panel}>
                        <header>
                            <h2>Đánh giá mới nhất</h2>
                            <Link to="/admin/review">Xem tất cả</Link>
                        </header>
                        {reviews.length ? (
                            <ul>
                                {reviews.map(review => (
                                    <li key={review.id}>
                                        <div>
                                            <strong>{review.company.name}</strong>
                                            <span className={s.clamp}>
                                                {review.content || 'Không có nội dung'} · {review.user.name}
                                            </span>
                                        </div>
                                        <div className={s.rowMeta}>
                                            <Rate disabled value={review.rating} className={s.rate} />
                                            <time>{dayjs(review.createdAt).format('DD/MM/YYYY')}</time>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá nào." />
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
