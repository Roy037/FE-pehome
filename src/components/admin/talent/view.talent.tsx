import { useEffect, useState } from 'react';
import { Avatar, Button, Drawer, Empty, Rate, Skeleton } from 'antd';
import { FileTextOutlined, MailOutlined } from '@ant-design/icons';
import { avatarUrl } from '@/components/client/avatar';
import CvViewerModal from '@/components/client/cv-viewer';
import { VipBadge } from '@/components/client/vip';
import { callFetchTalent } from '@/config/api';
import { EXPERIENCE_LIST, LEVEL_LIST, labelOf } from '@/config/utils';
import { ITalentDetail } from '@/types/backend';
import s from '@/styles/admin.module.scss';

interface IProps {
    id: number | null;
    onClose: () => void;
}

const month = (value?: string) => (value ? value.split('-').reverse().join('/') : '');

const ViewTalent = ({ id, onClose }: IProps) => {
    const [detail, setDetail] = useState<ITalentDetail | null>(null);
    const [failed, setFailed] = useState(false);
    const [viewingCv, setViewingCv] = useState(false);

    useEffect(() => {
        if (id === null) return;
        let ignore = false;
        setDetail(null);
        setFailed(false);
        (async () => {
            try {
                const res = await callFetchTalent(id);
                if (ignore) return;
                if (res.data) setDetail(res.data);
                else setFailed(true);
            } catch {
                if (!ignore) setFailed(true);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);

    const talent = detail?.talent;
    const chips = talent
        ? ([
              labelOf(EXPERIENCE_LIST, talent.experience ?? ''),
              labelOf(LEVEL_LIST, talent.level ?? ''),
              talent.industry,
              talent.occupation,
          ].filter(Boolean) as string[])
        : [];

    return (
        <Drawer open={id !== null} onClose={onClose} width="min(560px, 100vw)" title="Hồ sơ ứng viên" destroyOnClose>
            {failed && <Empty description="Ứng viên đã tắt chia sẻ hồ sơ hoặc không còn tồn tại." />}
            {!failed && !detail && <Skeleton active avatar paragraph={{ rows: 8 }} />}
            {detail && talent && (
                <div className={s.talentView}>
                    <div className={s.talentHead}>
                        <Avatar size={64} src={talent.avatar ? avatarUrl(talent.avatar) : undefined}>
                            {talent.name.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <div>
                            <h2>
                                {talent.name}
                                {talent.premium && (
                                    <>
                                        {' '}
                                        <VipBadge />
                                    </>
                                )}
                            </h2>
                            <p>{talent.headline || 'Chưa có chức danh'}</p>
                        </div>
                    </div>
                    {chips.length > 0 && (
                        <ul className={s.talentChips}>
                            {chips.map(chip => (
                                <li key={chip}>{chip}</li>
                            ))}
                        </ul>
                    )}
                    <div className={s.talentContact}>
                        <Button icon={<MailOutlined />} href={`mailto:${detail.email}`}>
                            {detail.email}
                        </Button>
                        <Button
                            type="primary"
                            icon={<FileTextOutlined />}
                            disabled={!talent.hasCv}
                            onClick={() => setViewingCv(true)}
                        >
                            {talent.hasCv ? 'Xem CV' : 'Chưa có CV'}
                        </Button>
                    </div>

                    {(detail.shortGoals.length > 0 || detail.longGoals.length > 0) && (
                        <section>
                            <h3>Mục tiêu nghề nghiệp</h3>
                            {detail.shortGoals.length > 0 && (
                                <>
                                    <h4>Ngắn hạn</h4>
                                    <ul>
                                        {detail.shortGoals.map(goal => (
                                            <li key={goal}>{goal}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            {detail.longGoals.length > 0 && (
                                <>
                                    <h4>Dài hạn</h4>
                                    <ul>
                                        {detail.longGoals.map(goal => (
                                            <li key={goal}>{goal}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </section>
                    )}
                    {detail.experiences.length > 0 && (
                        <section>
                            <h3>Kinh nghiệm làm việc</h3>
                            <ul className={s.talentTimeline}>
                                {detail.experiences.map((job, index) => (
                                    <li key={index}>
                                        <strong>
                                            {job.title} · {job.company}
                                        </strong>
                                        <small>
                                            {month(job.fromMonth)} –{' '}
                                            {job.current ? 'Hiện tại' : month(job.toMonth) || '…'}
                                        </small>
                                        {job.description && <p>{job.description}</p>}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {talent.skills.length > 0 && (
                        <section>
                            <h3>Kỹ năng</h3>
                            <ul className={s.talentSkills}>
                                {talent.skills.map(skill => (
                                    <li key={skill.name}>
                                        <span>{skill.name}</span>
                                        <Rate disabled value={skill.level} aria-label={`Mức ${skill.level}/5`} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    <small className={s.talentNote}>
                        Ứng viên đã bật cho phép nhà tuyển dụng đã được duyệt xem hồ sơ này và có thể tắt bất cứ lúc
                        nào.
                    </small>
                    <CvViewerModal
                        open={viewingCv}
                        endpoint={`/api/v1/talents/${talent.id}/cv`}
                        file={detail.cvName}
                        name={detail.cvName}
                        onClose={() => setViewingCv(false)}
                    />
                </div>
            )}
        </Drawer>
    );
};

export default ViewTalent;
