import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Button, Form, Modal, Select, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BsBookmark } from 'react-icons/bs';
import { BankOutlined, FileTextOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { ICompany, IJob, IMyPlan, IResume, ISubscribers } from '@/types/backend';
import {
    callCreateSubscriber,
    callFetchAllSkill,
    callFetchFollowedCompanies,
    callFetchMyPlan,
    callFetchResumeByUser,
    callFetchSavedJobs,
    callGetSubscriberSkills,
    callUpdateSubscriber,
} from '@/config/api';
import { RESUME_STATUS, formatDate, isExternalCv } from '@/config/utils';
import { useAppSelector } from '@/redux/hooks';
import CompanyCard from '../card/company.card';
import { JobRow } from '../card/job.card';
import { StatePanel } from '../decor';
import { useAuthModal } from '../auth';
import CvViewerModal from '../cv-viewer';
import MyPlan from '../my-plan';
import { useUpgradeModal } from './upgrade.modal';
import styles from '@/styles/client.module.scss';

export type AccountTab = 'user-resume' | 'saved-jobs' | 'followed-companies' | 'email-by-skills' | 'my-plan';

type ResumeRow = IResume & { companyName?: string; job?: { id: string; name: string } };

const UserResume = () => {
    const [rows, setRows] = useState<ResumeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState<ResumeRow | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await callFetchResumeByUser();
                if (res.data) setRows(res.data.result as ResumeRow[]);
                else message.error('Chưa thể tải hồ sơ ứng tuyển.');
            } catch {
                message.error('Không thể kết nối để tải hồ sơ ứng tuyển.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const columns: ColumnsType<ResumeRow> = [
        { title: 'Vị trí ứng tuyển', key: 'job', render: (_, row) => <strong>{row.job?.name ?? '—'}</strong> },
        { title: 'Công ty', dataIndex: 'companyName' },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status: string, row) => (
                <div>
                    <Tag color={RESUME_STATUS[status]?.color}>{RESUME_STATUS[status]?.label ?? status}</Tag>
                    {status === 'INTERVIEW' && row.interviewAt && (
                        <div className={styles.statusNote}>
                            Phỏng vấn lúc <strong>{dayjs(row.interviewAt).format('HH:mm DD/MM/YYYY')}</strong>
                            {row.meetingLink && (
                                <>
                                    {' '}
                                    ·{' '}
                                    <a href={row.meetingLink} target="_blank" rel="noopener noreferrer">
                                        Vào phòng họp
                                    </a>
                                </>
                            )}
                        </div>
                    )}
                    {row.decisionNote && ['INTERVIEW', 'ACCEPTED', 'REJECTED'].includes(status) && (
                        <div className={styles.statusNote}>“{row.decisionNote}”</div>
                    )}
                </div>
            ),
        },
        { title: 'Ngày ứng tuyển', dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
        {
            title: '',
            key: 'cv',
            align: 'right',
            render: (_, row) =>
                isExternalCv(row.url) ? (
                    <Button type="link" size="small" href={row.url} target="_blank" rel="noopener noreferrer">
                        Mở liên kết CV
                    </Button>
                ) : (
                    <Button type="link" size="small" onClick={() => setViewing(row)}>
                        Xem CV
                    </Button>
                ),
        },
    ];

    if (!loading && rows.length === 0) {
        return (
            <StatePanel
                compact
                icon={<FileTextOutlined />}
                title="Bạn chưa ứng tuyển vị trí nào"
                text="Khi bạn gửi CV cho nhà tuyển dụng, hồ sơ và trạng thái xử lý sẽ xuất hiện ở đây."
                action={
                    <Link className={styles.btnPrimarySm} to="/job">
                        Khám phá việc làm
                    </Link>
                }
            />
        );
    }
    return (
        <>
            <Table<ResumeRow>
                columns={columns}
                dataSource={rows}
                rowKey="id"
                scroll={{ x: 640 }}
                loading={loading}
                pagination={false}
            />
            <CvViewerModal
                open={Boolean(viewing)}
                endpoint={viewing ? `/api/v1/resumes/${viewing.id}/document` : null}
                file={viewing?.url}
                name={viewing?.url}
                onClose={() => setViewing(null)}
            />
        </>
    );
};

const SavedJobs = () => {
    const ids = useAppSelector(state => state.savedJob.ids);
    const [jobs, setJobs] = useState<IJob[] | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await callFetchSavedJobs();
                setJobs(res.data ?? []);
            } catch {
                setJobs([]);
                message.error('Chưa thể tải việc làm đã lưu.');
            }
        })();
    }, []);

    if (jobs === null) return <div className={styles.modalLoading}>Đang tải việc làm đã lưu…</div>;
    const visible = jobs.filter(job => ids.includes(String(job.id)));
    if (visible.length === 0) {
        return (
            <StatePanel
                compact
                icon={<BsBookmark />}
                title="Chưa có việc làm nào được lưu"
                text="Nhấn biểu tượng dấu trang trên thẻ việc làm để lưu lại và xem sau."
                action={
                    <Link className={styles.btnPrimarySm} to="/job">
                        Tìm việc làm
                    </Link>
                }
            />
        );
    }
    return (
        <div className={styles.savedList}>
            {visible.map(job => (
                <JobRow key={job.id} job={job} />
            ))}
        </div>
    );
};

const FollowedCompanies = () => {
    const ids = useAppSelector(state => state.followedCompany.ids);
    const [companies, setCompanies] = useState<ICompany[] | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await callFetchFollowedCompanies();
                setCompanies(res.data ?? []);
            } catch {
                setCompanies([]);
                message.error('Chưa thể tải danh sách công ty đang theo dõi.');
            }
        })();
    }, []);

    if (companies === null) return <div className={styles.modalLoading}>Đang tải công ty đang theo dõi…</div>;
    const visible = companies.filter(company => ids.includes(String(company.id)));
    if (visible.length === 0) {
        return (
            <StatePanel
                compact
                icon={<BankOutlined />}
                title="Chưa theo dõi công ty nào"
                text="Nhấn biểu tượng trái tim trên thẻ công ty để theo dõi nhà tuyển dụng bạn quan tâm."
                action={
                    <Link className={styles.btnPrimarySm} to="/company">
                        Khám phá công ty
                    </Link>
                }
            />
        );
    }
    return (
        <div className={styles.followedGrid}>
            {visible.map(company => (
                <CompanyCard key={company.id} company={company} />
            ))}
        </div>
    );
};

export const JobByEmail = ({ compact }: { compact?: boolean }) => {
    const [form] = Form.useForm();
    const user = useAppSelector(state => state.account.user);
    const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
    const [subscriber, setSubscriber] = useState<ISubscribers | null>(null);
    const [saving, setSaving] = useState(false);
    const [plan, setPlan] = useState<IMyPlan | null>(null);
    const openUpgrade = useUpgradeModal();

    useEffect(() => {
        (async () => {
            try {
                const skills = await callFetchAllSkill('page=1&size=100&sort=name,asc');
                if (skills.data)
                    setOptions(
                        skills.data.result.map(skill => ({ label: skill.name || 'Kỹ năng', value: String(skill.id) })),
                    );
                const res = await callGetSubscriberSkills();
                if (res.data) {
                    setSubscriber(res.data);
                    form.setFieldValue(
                        'skills',
                        res.data.skills.map(item => String(item.id)),
                    );
                }
                const mine = await callFetchMyPlan();
                if (mine.data) setPlan(mine.data);
            } catch {
                message.error('Chưa thể tải thông tin nhận việc làm qua email.');
            }
        })();
    }, [form]);

    const onFinish = async (values: { skills: string[] }) => {
        const skills = values.skills.map(id => ({ id }));
        setSaving(true);
        try {
            const res = subscriber?.id
                ? await callUpdateSubscriber({ id: subscriber.id, email: user.email, name: user.name, skills })
                : await callCreateSubscriber({ email: user.email, name: user.name, skills });
            if (!res.data) throw new Error(res.message);
            setSubscriber(res.data);
            message.success('Đã lưu kỹ năng nhận thông tin việc làm.');
        } catch {
            message.error('Chưa thể lưu thông tin. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            className={compact ? styles.subscribeFormCompact : styles.subscribeForm}
            requiredMark={false}
        >
            {!compact && (
                <p className={styles.subscribeIntro}>
                    Chọn kỹ năng bạn quan tâm. Thông tin việc làm phù hợp sẽ được gửi tới <strong>{user.email}</strong>.
                </p>
            )}
            <Form.Item
                label="Kỹ năng quan tâm"
                name="skills"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một kỹ năng.' }]}
            >
                <Select
                    mode="multiple"
                    allowClear
                    placeholder="Chọn kỹ năng của bạn"
                    options={options}
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    maxCount={plan?.alertSkillCap}
                />
            </Form.Item>
            {plan && plan.alertSkillCap < 100 && (
                <p className={styles.subscribeIntro}>
                    Gói {plan.name} theo dõi tối đa <strong>{plan.alertSkillCap}</strong> kỹ năng.{' '}
                    <button type="button" className={styles.linkButton} onClick={openUpgrade}>
                        Nâng cấp để chọn thêm
                    </button>
                </p>
            )}
            <Button type="primary" htmlType="submit" loading={saving}>
                {subscriber?.id ? 'Cập nhật kỹ năng' : 'Đăng ký nhận tin'}
            </Button>
        </Form>
    );
};

const AccountModalContext = createContext<(tab?: AccountTab) => void>(() => undefined);
export const useAccountModal = () => useContext(AccountModalContext);

export const AccountModalProvider = ({ children }: { children: ReactNode }) => {
    const [tab, setTab] = useState<AccountTab | null>(null);
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const openAuth = useAuthModal();
    const location = useLocation();

    useEffect(() => {
        setTab(null);
    }, [location.pathname, location.search]);

    const open = useCallback(
        (next?: AccountTab) => {
            if (!isAuthenticated) {
                openAuth('login');
                return;
            }
            setTab(next ?? 'user-resume');
        },
        [isAuthenticated, openAuth],
    );

    return (
        <AccountModalContext.Provider value={open}>
            {children}
            <Modal
                title="Hồ sơ & việc làm của bạn"
                open={tab !== null}
                onCancel={() => setTab(null)}
                footer={null}
                destroyOnClose
                width={800}
                className={styles.accountModal}
                centered
            >
                <Tabs
                    activeKey={tab ?? undefined}
                    onChange={key => setTab(key as AccountTab)}
                    items={[
                        { key: 'user-resume', label: 'Hồ sơ đã ứng tuyển', children: <UserResume /> },
                        { key: 'saved-jobs', label: 'Việc làm đã lưu', children: <SavedJobs /> },
                        { key: 'followed-companies', label: 'Công ty đang theo dõi', children: <FollowedCompanies /> },
                        { key: 'email-by-skills', label: 'Nhận việc làm qua email', children: <JobByEmail /> },
                        { key: 'my-plan', label: 'Gói của tôi', children: <MyPlan /> },
                    ]}
                />
            </Modal>
        </AccountModalContext.Provider>
    );
};
