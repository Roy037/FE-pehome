import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Image, Popconfirm, Progress, Rate, Skeleton, Switch, Upload, message, notification } from 'antd';
import type { UploadProps } from 'antd';
import {
    CameraOutlined,
    CheckCircleFilled,
    CloudUploadOutlined,
    DeleteOutlined,
    EditOutlined,
    FileTextOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Navigate } from 'react-router-dom';
import { callFetchMyProfile, callGetSubscriberSkills, callSaveMyProfile, callUploadSingleFile } from '@/config/api';
import { EXPERIENCE_LIST, LEVEL_LIST, errorMessage } from '@/config/utils';
import { useAppDispatch, useAppSelector, useIsEmployer, useIsVip } from '@/redux/hooks';
import { VipBadge, VipFrame } from '@/components/client/vip';
import { fetchAccount } from '@/redux/slice/accountSlide';
import { IProfile, IProfileExperience, IProfileReference } from '@/types/backend';
import { StatePanel } from '@/components/client/decor';
import { useAuthModal } from '@/components/client/auth';
import { useAccountModal } from '@/components/client/modal/manage.account';
import CvViewerModal from '@/components/client/cv-viewer';
import UserAvatar, { avatarUrl } from '@/components/client/avatar';
import { BasicModal, ExperienceModal, GoalsModal, ReferenceModal, SkillsModal } from './modals';
import ui from '@/styles/client.module.scss';
import p from '@/styles/profile.module.scss';

type Editing =
    | null
    | 'basic'
    | 'goals'
    | 'skills'
    | { kind: 'experience'; index: number | null }
    | { kind: 'reference'; index: number | null };

const month = (value?: string) =>
    value && /^\d{4}-\d{2}$/.test(value) ? `${value.slice(5)}/${value.slice(0, 4)}` : '';
const labelOf = (list: { label: string; value: string }[], value?: string | null) =>
    list.find(item => item.value === value)?.label;
const LEVEL_TIPS = ['Cơ bản', 'Khá', 'Tốt', 'Rất tốt', 'Chuyên gia'];

const Card = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
    <section className={p.card}>
        <header className={p.cardHead}>
            <h2>{title}</h2>
            {action}
        </header>
        {children}
    </section>
);

const EditButton = ({
    label,
    onClick,
    icon = <EditOutlined />,
}: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
}) => (
    <button type="button" className={p.iconButton} onClick={onClick} aria-label={label} title={label}>
        {icon}
    </button>
);

const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading } = useAppSelector(state => state.account);
    const isEmployer = useIsEmployer();
    const isVip = useIsVip();
    const openAuth = useAuthModal();
    const openAccount = useAccountModal();
    const [profile, setProfile] = useState<IProfile | null>(null);
    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [editing, setEditing] = useState<Editing>(null);
    const [cvPercent, setCvPercent] = useState<number | null>(null);
    const [viewingCv, setViewingCv] = useState(false);
    const [avatarBusy, setAvatarBusy] = useState(false);

    const load = useCallback(async () => {
        setStatus('loading');
        try {
            const res = await callFetchMyProfile();
            if (!res.data) throw new Error();
            setProfile(res.data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, []);
    useEffect(() => {
        if (isAuthenticated) load();
    }, [isAuthenticated, load]);

    const save = async (patch: Partial<IProfile>) => {
        if (!profile) return false;
        const { email: _email, updatedAt: _updatedAt, cvUpdatedAt: _cvUpdatedAt, ...body } = { ...profile, ...patch };
        try {
            const res = await callSaveMyProfile(body);
            if (!res.data) throw new Error(errorMessage(res.message, 'Chưa thể lưu hồ sơ. Vui lòng thử lại.'));
            if (res.data.name !== profile.name || res.data.avatar !== profile.avatar) dispatch(fetchAccount());
            setProfile(res.data);
            message.success('Đã lưu hồ sơ.');
            return true;
        } catch (error) {
            notification.error({
                message: 'Chưa thể lưu hồ sơ',
                description: (error instanceof Error && error.message) || 'Vui lòng thử lại.',
            });
            return false;
        }
    };

    const changeAvatar = async (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            message.error('Ảnh đại diện chỉ nhận JPG, PNG hoặc WEBP.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            message.error('Ảnh đại diện tối đa 2MB.');
            return;
        }
        setAvatarBusy(true);
        try {
            const res = await callUploadSingleFile(file, 'avatar');
            if (!res.data?.fileName) throw new Error();
            await save({ avatar: res.data.fileName });
        } catch {
            notification.error({ message: 'Chưa tải được ảnh', description: 'Vui lòng thử lại.' });
        } finally {
            setAvatarBusy(false);
        }
    };

    const toggleVisible = (checked: boolean) => save({ visibleToEmployers: checked });

    const toggleAlert = async (checked: boolean) => {
        if (!(await save({ jobAlert: checked })) || !checked) return;
        const subscription = await callGetSubscriberSkills().catch(() => null);
        if (!subscription?.data?.skills?.length) openAccount('email-by-skills');
    };

    const upsert = <T,>(list: T[], index: number | null, item: T) =>
        index === null ? [...list, item] : list.map((current, position) => (position === index ? item : current));

    const uploadProps: UploadProps = {
        accept: '.pdf,application/pdf',
        maxCount: 1,
        showUploadList: false,
        disabled: cvPercent !== null,
        beforeUpload: file => {
            if (!/\.pdf$/i.test(file.name)) {
                message.error('Chỉ nhận CV định dạng PDF.');
                return Upload.LIST_IGNORE;
            }
            if (file.size > 5 * 1024 * 1024) {
                message.error('CV tối đa 5 MB.');
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async ({ file }) => {
            const picked = file as File;
            setCvPercent(0);
            try {
                const res = await callUploadSingleFile(picked, 'resume', setCvPercent);
                if (!res.data) throw new Error(errorMessage(res.message, 'Tải CV chưa thành công.'));
                await save({ cvUrl: res.data.fileName, cvName: picked.name });
            } catch (error) {
                notification.error({
                    message: 'Tải CV chưa thành công',
                    description: (error instanceof Error && error.message) || 'Vui lòng thử lại.',
                });
            } finally {
                setCvPercent(null);
            }
        },
    };

    const checklist = useMemo(
        () =>
            profile
                ? [
                      {
                          label: 'Thông tin cơ bản',
                          done: Boolean(
                              profile.headline &&
                              profile.experience &&
                              profile.level &&
                              profile.industry &&
                              profile.occupation,
                          ),
                          open: () => setEditing('basic'),
                      },
                      {
                          label: 'Mục tiêu nghề nghiệp',
                          done: profile.shortGoals.length + profile.longGoals.length > 0,
                          open: () => setEditing('goals'),
                      },
                      {
                          label: 'Kinh nghiệm làm việc',
                          done: profile.experiences.length > 0 || profile.experience === 'NONE',
                          open: () => setEditing({ kind: 'experience', index: null }),
                      },
                      { label: 'Kỹ năng', done: profile.skills.length > 0, open: () => setEditing('skills') },
                      {
                          label: 'Người tham khảo',
                          done: profile.references.length > 0,
                          open: () => setEditing({ kind: 'reference', index: null }),
                      },
                      { label: 'CV của bạn', done: Boolean(profile.cvUrl), open: undefined },
                  ]
                : [],
        [profile],
    );
    const percent = checklist.length
        ? Math.round((checklist.filter(item => item.done).length * 100) / checklist.length)
        : 0;

    if (isLoading)
        return (
            <div className={`${ui.container} ${p.page}`}>
                <Skeleton active paragraph={{ rows: 8 }} />
            </div>
        );
    if (isEmployer) return <Navigate to="/admin" replace />; // the candidate profile is not an employer feature
    if (!isAuthenticated) {
        return (
            <div className={`${ui.container} ${p.page}`}>
                <StatePanel
                    icon={<UserOutlined />}
                    title="Đăng nhập để quản lý hồ sơ"
                    text="Tạo hồ sơ một lần, ứng tuyển nhanh hơn ở mọi vị trí."
                    action={
                        <button type="button" className={ui.btnPrimarySm} onClick={() => openAuth('login')}>
                            Đăng nhập
                        </button>
                    }
                />
            </div>
        );
    }
    if (status === 'loading' || !profile) {
        return (
            <div className={`${ui.container} ${p.page}`}>
                {status === 'error' ? (
                    <StatePanel
                        icon={<ReloadOutlined />}
                        title="Chưa tải được hồ sơ"
                        text="Vui lòng kiểm tra kết nối và thử lại."
                        action={
                            <button type="button" className={ui.btnOutline} onClick={load}>
                                Thử lại
                            </button>
                        }
                    />
                ) : (
                    <Skeleton active paragraph={{ rows: 8 }} />
                )}
            </div>
        );
    }

    const chips = [
        profile.age ? `${profile.age} tuổi` : null,
        ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' } as Record<string, string>)[profile.gender ?? ''] ?? null,
        profile.address,
        labelOf(EXPERIENCE_LIST, profile.experience),
        labelOf(LEVEL_LIST, profile.level),
        profile.industry,
        profile.occupation,
    ].filter(Boolean) as string[];
    const experience = editing && typeof editing === 'object' && editing.kind === 'experience' ? editing : null;
    const reference = editing && typeof editing === 'object' && editing.kind === 'reference' ? editing : null;

    return (
        <div className={`${ui.container} ${p.page}`}>
            <h1 className={p.pageTitle}>Quản lý hồ sơ</h1>
            <div className={p.layout}>
                <div className={p.main}>
                    <section className={`${p.card} ${p.hero}`}>
                        <div className={p.avatarBox}>
                            <VipFrame vip={isVip}>
                                <div className={p.avatarFrame}>
                                    {profile.avatar ? (
                                        <Image
                                            rootClassName={p.avatarRoot}
                                            className={p.avatarPhoto}
                                            src={avatarUrl(profile.avatar)}
                                            width={80}
                                            height={80}
                                            alt={`Ảnh đại diện của ${profile.name}`}
                                            preview={{ mask: 'Xem' }}
                                        />
                                    ) : (
                                        <UserAvatar name={profile.name} className={p.avatar} />
                                    )}
                                    <Upload
                                        accept=".jpg,.jpeg,.png,.webp"
                                        showUploadList={false}
                                        disabled={avatarBusy}
                                        beforeUpload={file => {
                                            changeAvatar(file);
                                            return Upload.LIST_IGNORE;
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className={p.avatarEdit}
                                            disabled={avatarBusy}
                                            aria-label="Đổi ảnh đại diện"
                                            title="Đổi ảnh đại diện"
                                        >
                                            <CameraOutlined />
                                        </button>
                                    </Upload>
                                </div>
                            </VipFrame>
                            {profile.avatar && (
                                <Popconfirm
                                    title="Xoá ảnh đại diện?"
                                    okText="Xoá"
                                    cancelText="Huỷ"
                                    onConfirm={() => save({ avatar: null })}
                                >
                                    <button type="button" className={p.avatarRemove}>
                                        Xoá ảnh
                                    </button>
                                </Popconfirm>
                            )}
                        </div>
                        <div className={p.heroBody}>
                            <div className={p.heroTop}>
                                <div>
                                    <h2>
                                        {profile.name}
                                        {isVip && (
                                            <>
                                                {' '}
                                                <VipBadge />
                                            </>
                                        )}
                                    </h2>
                                    <p className={profile.headline ? undefined : p.placeholder}>
                                        {profile.headline || 'Thêm chức danh của bạn'}
                                    </p>
                                </div>
                                <EditButton label="Sửa thông tin cơ bản" onClick={() => setEditing('basic')} />
                            </div>
                            {chips.length > 0 ? (
                                <ul className={p.chips}>
                                    {chips.map(chip => (
                                        <li key={chip}>{chip}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={p.placeholder}>
                                    Bổ sung kinh nghiệm, cấp bậc, lĩnh vực và ngành nghề để nhà tuyển dụng hiểu bạn hơn.
                                </p>
                            )}
                            <div className={p.alertRow}>
                                <Switch
                                    checked={profile.jobAlert}
                                    onChange={toggleAlert}
                                    aria-labelledby="alert-label"
                                />
                                <div>
                                    <strong id="alert-label">Đang bật thông báo việc làm</strong>
                                    <small>Nhận email khi có việc làm phù hợp với kỹ năng bạn chọn.</small>
                                </div>
                            </div>
                            <div className={p.alertRow}>
                                <Switch
                                    checked={profile.visibleToEmployers}
                                    onChange={toggleVisible}
                                    aria-labelledby="visible-label"
                                />
                                <div>
                                    <strong id="visible-label">Cho phép nhà tuyển dụng tìm thấy hồ sơ</strong>
                                    <small>
                                        Nhà tuyển dụng đã được duyệt xem được hồ sơ, CV và email của bạn. Tắt bất cứ lúc
                                        nào.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </section>

                    <Card
                        title="Mục tiêu nghề nghiệp"
                        action={<EditButton label="Sửa mục tiêu nghề nghiệp" onClick={() => setEditing('goals')} />}
                    >
                        {profile.shortGoals.length + profile.longGoals.length === 0 ? (
                            <p className={p.placeholder}>
                                Chưa có mục tiêu nghề nghiệp. Hãy chia sẻ bạn muốn đi đến đâu.
                            </p>
                        ) : (
                            <div className={p.goals}>
                                <div>
                                    <h3>Mục tiêu ngắn hạn</h3>
                                    {profile.shortGoals.length ? (
                                        <ul>
                                            {profile.shortGoals.map(goal => (
                                                <li key={goal}>{goal}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className={p.placeholder}>Chưa có.</p>
                                    )}
                                </div>
                                <div>
                                    <h3>Mục tiêu dài hạn</h3>
                                    {profile.longGoals.length ? (
                                        <ul>
                                            {profile.longGoals.map(goal => (
                                                <li key={goal}>{goal}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className={p.placeholder}>Chưa có.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card
                        title="Kinh nghiệm làm việc"
                        action={
                            <EditButton
                                label="Thêm kinh nghiệm"
                                icon={<PlusOutlined />}
                                onClick={() => setEditing({ kind: 'experience', index: null })}
                            />
                        }
                    >
                        {profile.experiences.length === 0 ? (
                            <div className={p.emptyExperience}>
                                <p>Chưa có kinh nghiệm làm việc</p>
                                <Button
                                    icon={<PlusOutlined />}
                                    onClick={() => setEditing({ kind: 'experience', index: null })}
                                >
                                    Thêm kinh nghiệm
                                </Button>
                            </div>
                        ) : (
                            <ol className={p.timeline}>
                                {profile.experiences.map((item, index) => (
                                    <li key={`${item.company}-${item.fromMonth}-${index}`}>
                                        <div className={p.timelineBody}>
                                            <strong>{item.title}</strong>
                                            <span>{item.company}</span>
                                            <small>
                                                {month(item.fromMonth)} –{' '}
                                                {item.current ? 'Hiện tại' : month(item.toMonth) || '—'}
                                            </small>
                                            {item.description && <p>{item.description}</p>}
                                        </div>
                                        <div className={p.rowActions}>
                                            <EditButton
                                                label="Sửa kinh nghiệm"
                                                onClick={() => setEditing({ kind: 'experience', index })}
                                            />
                                            <Popconfirm
                                                title="Xóa kinh nghiệm này?"
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                onConfirm={() =>
                                                    save({
                                                        experiences: profile.experiences.filter(
                                                            (_, position) => position !== index,
                                                        ),
                                                    })
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={p.iconButton}
                                                    aria-label="Xóa kinh nghiệm"
                                                    title="Xóa"
                                                >
                                                    <DeleteOutlined />
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Card>

                    <Card
                        title="Kỹ năng"
                        action={<EditButton label="Sửa kỹ năng" onClick={() => setEditing('skills')} />}
                    >
                        {profile.skills.length === 0 ? (
                            <p className={p.placeholder}>
                                Chưa có kỹ năng. Thêm quản lý thời gian, giao tiếp tiếng Anh, công nghệ bạn dùng…
                            </p>
                        ) : (
                            <ul className={p.skills}>
                                {profile.skills.map(skill => (
                                    <li key={skill.name}>
                                        <span>{skill.name}</span>
                                        <Rate
                                            disabled
                                            value={skill.level}
                                            tooltips={LEVEL_TIPS}
                                            aria-label={`Mức ${skill.level}/5`}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card
                        title="Người tham khảo"
                        action={
                            <EditButton
                                label="Thêm người tham khảo"
                                icon={<PlusOutlined />}
                                onClick={() => setEditing({ kind: 'reference', index: null })}
                            />
                        }
                    >
                        {profile.references.length === 0 ? (
                            <p className={p.placeholder}>Chưa có người tham khảo.</p>
                        ) : (
                            <ul className={p.references}>
                                {profile.references.map((item, index) => (
                                    <li key={`${item.name}-${index}`}>
                                        <div>
                                            <strong>{item.name}</strong>
                                            <span>
                                                {[item.title, item.company].filter(Boolean).join(' · ') ||
                                                    'Chưa cập nhật chức vụ'}
                                            </span>
                                            <small>{[item.phone, item.email].filter(Boolean).join(' · ')}</small>
                                        </div>
                                        <div className={p.rowActions}>
                                            <EditButton
                                                label="Sửa người tham khảo"
                                                onClick={() => setEditing({ kind: 'reference', index })}
                                            />
                                            <Popconfirm
                                                title="Xóa người tham khảo này?"
                                                okText="Xóa"
                                                cancelText="Hủy"
                                                onConfirm={() =>
                                                    save({
                                                        references: profile.references.filter(
                                                            (_, position) => position !== index,
                                                        ),
                                                    })
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={p.iconButton}
                                                    aria-label="Xóa người tham khảo"
                                                    title="Xóa"
                                                >
                                                    <DeleteOutlined />
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card title="CV của bạn">
                        {cvPercent !== null ? (
                            <div className={p.cvBusy}>
                                <FileTextOutlined aria-hidden="true" />
                                <div>
                                    <strong>Đang tải CV…</strong>
                                    <Progress percent={cvPercent} strokeColor="#E3763C" size="small" />
                                </div>
                            </div>
                        ) : profile.cvUrl ? (
                            <div className={p.cvFile}>
                                <span className={p.cvIcon} aria-hidden="true">
                                    <FileTextOutlined />
                                </span>
                                <div>
                                    <strong>{profile.cvName || profile.cvUrl}</strong>
                                    <small>
                                        {profile.cvUpdatedAt
                                            ? `Cập nhật ${dayjs(profile.cvUpdatedAt).format('DD/MM/YYYY')}`
                                            : 'Đã tải lên'}
                                    </small>
                                </div>
                                <div className={p.rowActions}>
                                    <button type="button" className={ui.btnOutline} onClick={() => setViewingCv(true)}>
                                        Xem CV
                                    </button>
                                    <Upload {...uploadProps}>
                                        <Button icon={<CloudUploadOutlined />}>Thay CV</Button>
                                    </Upload>
                                    <Popconfirm
                                        title="Xóa CV khỏi hồ sơ?"
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        onConfirm={() => save({ cvUrl: null, cvName: null })}
                                    >
                                        <Button danger type="text" icon={<DeleteOutlined />} aria-label="Xóa CV" />
                                    </Popconfirm>
                                </div>
                            </div>
                        ) : (
                            <Upload.Dragger {...uploadProps} className={p.dragger}>
                                <p className={p.draggerIcon}>
                                    <CloudUploadOutlined />
                                </p>
                                <p>
                                    <strong>Kéo thả CV vào đây hoặc bấm để chọn</strong>
                                </p>
                                <p className={p.placeholder}>Chỉ nhận PDF · tối đa 5 MB</p>
                            </Upload.Dragger>
                        )}
                    </Card>
                </div>

                <aside className={p.side} aria-label="Mức độ hoàn thiện hồ sơ">
                    <section className={p.card}>
                        <header className={p.cardHead}>
                            <h2>Hoàn thiện hồ sơ</h2>
                        </header>
                        <div className={p.percent}>
                            <Progress type="circle" percent={percent} size={96} strokeColor="#E3763C" />
                        </div>
                        <ul className={p.checklist}>
                            {checklist.map(item => (
                                <li key={item.label} className={item.done ? p.done : undefined}>
                                    {item.done ? (
                                        <CheckCircleFilled aria-hidden="true" />
                                    ) : (
                                        <MinusCircleOutlined aria-hidden="true" />
                                    )}
                                    {item.open && !item.done ? (
                                        <button type="button" onClick={item.open}>
                                            {item.label}
                                        </button>
                                    ) : (
                                        <span>{item.label}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section className={p.card}>
                        <header className={p.cardHead}>
                            <h2>Lối tắt</h2>
                        </header>
                        <div className={p.shortcuts}>
                            <button type="button" onClick={() => openAccount('user-resume')}>
                                Hồ sơ đã ứng tuyển
                            </button>
                            <button type="button" onClick={() => openAccount('saved-jobs')}>
                                Việc làm đã lưu
                            </button>
                            <button type="button" onClick={() => openAccount('email-by-skills')}>
                                Nhận việc qua email
                            </button>
                        </div>
                    </section>
                </aside>
            </div>

            <CvViewerModal
                open={viewingCv}
                endpoint="/api/v1/me/profile/cv"
                file={profile.cvUrl}
                name={profile.cvName}
                onClose={() => setViewingCv(false)}
            />
            <BasicModal open={editing === 'basic'} onClose={() => setEditing(null)} profile={profile} onSave={save} />
            <GoalsModal open={editing === 'goals'} onClose={() => setEditing(null)} profile={profile} onSave={save} />
            <SkillsModal
                open={editing === 'skills'}
                onClose={() => setEditing(null)}
                skills={profile.skills}
                onSave={skills => save({ skills })}
            />
            <ExperienceModal
                open={Boolean(experience)}
                onClose={() => setEditing(null)}
                value={experience && experience.index !== null ? profile.experiences[experience.index] : null}
                onSave={(item: IProfileExperience) =>
                    save({ experiences: upsert(profile.experiences, experience?.index ?? null, item) })
                }
            />
            <ReferenceModal
                open={Boolean(reference)}
                onClose={() => setEditing(null)}
                value={reference && reference.index !== null ? profile.references[reference.index] : null}
                onSave={(item: IProfileReference) =>
                    save({ references: upsert(profile.references, reference?.index ?? null, item) })
                }
            />
        </div>
    );
};

export default ProfilePage;
