import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Drawer, Input, Popconfirm, Rate, Space, Tag, message, notification } from 'antd';
import { CalendarOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { callChangeResumeStatus, callEvaluateResume } from '@/config/api';
import { RESUME_NEXT, RESUME_STATUS, errorMessage, isExternalCv } from '@/config/utils';
import { ALL_PERMISSIONS } from '@/config/permissions';
import Access from '@/components/share/access';
import CvViewerModal from '@/components/client/cv-viewer';
import { IResume } from '@/types/backend';
import { DecisionModal, InterviewModal } from './status-modals';

interface IProps {
    onClose: (v: boolean) => void;
    open: boolean;
    dataInit: IResume | null | any;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const when = (value?: string | null) => (value ? dayjs(value).format('HH:mm DD/MM/YYYY') : '—');

// One application: who applied, the CV, the employer's private score, and the pipeline buttons for the current status.
const ViewDetailResume = ({ onClose, open, dataInit, setDataInit, reloadTable }: IProps) => {
    const [viewingCv, setViewingCv] = useState(false);
    const [busy, setBusy] = useState(false);
    const [score, setScore] = useState(0);
    const [remark, setRemark] = useState('');
    const [savingEvaluation, setSavingEvaluation] = useState(false);
    const [interviewOpen, setInterviewOpen] = useState(false);
    const [decision, setDecision] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

    useEffect(() => {
        setScore(dataInit?.score ?? 0);
        setRemark(dataInit?.remark ?? '');
    }, [dataInit?.id, dataInit?.score, dataInit?.remark]);

    const next: string[] = RESUME_NEXT[dataInit?.status] ?? [];
    const status = RESUME_STATUS[dataInit?.status];

    const applied = (updated: IResume) => {
        setDataInit(updated);
        setInterviewOpen(false);
        setDecision(null);
        reloadTable();
    };

    const quick = async (target: string) => {
        if (!dataInit?.id) return;
        setBusy(true);
        const res = await callChangeResumeStatus(dataInit.id, { status: target });
        setBusy(false);
        if (res.data) {
            message.success(
                target === 'SHORTLISTED'
                    ? 'Đã đưa vào danh sách rút gọn và thông báo cho ứng viên.'
                    : 'Đã cập nhật trạng thái hồ sơ.',
            );
            applied(res.data);
        } else {
            notification.error({ message: 'Chưa thể cập nhật hồ sơ', description: errorMessage(res.message) });
        }
    };

    const saveEvaluation = async () => {
        if (!dataInit?.id) return;
        if (score < 1) {
            message.warning('Hãy chọn điểm từ 1 đến 10.');
            return;
        }
        setSavingEvaluation(true);
        const res = await callEvaluateResume(dataInit.id, score, remark);
        setSavingEvaluation(false);
        if (res.data) {
            message.success('Đã lưu đánh giá.');
            applied(res.data);
        } else notification.error({ message: 'Chưa thể lưu đánh giá', description: errorMessage(res.message) });
    };

    return (
        <>
            <Drawer
                title="Hồ sơ ứng tuyển"
                placement="right"
                onClose={() => {
                    onClose(false);
                    setDataInit(null);
                }}
                open={open}
                width="min(600px, 100vw)"
                destroyOnClose
                footer={
                    dataInit && next.length + (dataInit.status === 'INTERVIEW' ? 1 : 0) > 0 ? (
                        <Access permission={ALL_PERMISSIONS.RESUMES.CHANGE_STATUS} hideChildren>
                            <Space wrap>
                                {next.includes('REVIEWING') && (
                                    <Button loading={busy} onClick={() => quick('REVIEWING')}>
                                        Đánh dấu đang xem xét
                                    </Button>
                                )}
                                {next.includes('SHORTLISTED') && (
                                    <Popconfirm
                                        title="Đưa vào Shortlist?"
                                        description="Ứng viên sẽ nhận email thông báo."
                                        okText="Đưa vào"
                                        cancelText="Hủy"
                                        onConfirm={() => quick('SHORTLISTED')}
                                    >
                                        <Button type="primary" loading={busy}>
                                            Đưa vào Shortlist
                                        </Button>
                                    </Popconfirm>
                                )}
                                {next.includes('INTERVIEW') && (
                                    <Button type="primary" onClick={() => setInterviewOpen(true)}>
                                        Mời phỏng vấn
                                    </Button>
                                )}
                                {dataInit.status === 'INTERVIEW' && (
                                    <Button onClick={() => setInterviewOpen(true)}>Đổi lịch phỏng vấn</Button>
                                )}
                                {next.includes('ACCEPTED') && (
                                    <Button type="primary" onClick={() => setDecision('ACCEPTED')}>
                                        Nhận ứng viên
                                    </Button>
                                )}
                                {next.includes('REJECTED') && (
                                    <Button danger onClick={() => setDecision('REJECTED')}>
                                        Từ chối
                                    </Button>
                                )}
                            </Space>
                        </Access>
                    ) : null
                }
            >
                <Descriptions bordered column={1} size="small" labelStyle={{ width: 150 }}>
                    <Descriptions.Item label="Ứng viên">
                        {dataInit?.user?.name ?? '—'}
                        <br />
                        <span style={{ color: 'var(--muted)' }}>{dataInit?.email}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={status?.color} style={{ margin: 0 }}>
                            {status?.label ?? dataInit?.status}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Vị trí">{dataInit?.job?.name}</Descriptions.Item>
                    <Descriptions.Item label="Công ty">{dataInit?.companyName}</Descriptions.Item>
                    <Descriptions.Item label="Nộp lúc">{when(dataInit?.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="CV">
                        {!dataInit?.url ? (
                            '—'
                        ) : isExternalCv(dataInit.url) ? (
                            <Button
                                icon={<LinkOutlined />}
                                href={dataInit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Mở liên kết CV
                            </Button>
                        ) : (
                            <Button icon={<FileTextOutlined />} onClick={() => setViewingCv(true)}>
                                Xem CV
                            </Button>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thư xin việc">
                        {dataInit?.coverLetter ? (
                            <span style={{ whiteSpace: 'pre-line' }}>{dataInit.coverLetter}</span>
                        ) : (
                            <span style={{ color: 'var(--muted)' }}>Ứng viên không gửi kèm</span>
                        )}
                    </Descriptions.Item>
                </Descriptions>

                {dataInit?.interviewAt && (
                    <Alert
                        style={{ marginTop: 16 }}
                        type="info"
                        showIcon
                        icon={<CalendarOutlined />}
                        message={`Phỏng vấn lúc ${when(dataInit.interviewAt)}`}
                        description={
                            <>
                                {dataInit.meetingLink && (
                                    <a href={dataInit.meetingLink} target="_blank" rel="noopener noreferrer">
                                        <LinkOutlined /> {dataInit.meetingLink}
                                    </a>
                                )}
                            </>
                        }
                    />
                )}
                {dataInit?.decisionNote && (
                    <Alert
                        style={{ marginTop: 12 }}
                        type="warning"
                        message="Lời nhắn đã gửi cho ứng viên"
                        description={<span style={{ whiteSpace: 'pre-line' }}>{dataInit.decisionNote}</span>}
                    />
                )}

                <Access permission={ALL_PERMISSIONS.RESUMES.EVALUATE} hideChildren>
                    <section style={{ marginTop: 24 }}>
                        <h3 style={{ marginBottom: 4 }}>
                            Đánh giá ứng viên{' '}
                            <small style={{ marginLeft: 8, color: 'var(--muted)', fontWeight: 400 }}>
                                chỉ nhà tuyển dụng thấy
                            </small>
                        </h3>
                        <Space align="center" style={{ marginBottom: 12 }}>
                            <Rate count={10} value={score} onChange={setScore} allowClear={false} />
                            <strong>{score ? `${score}/10` : 'Chưa chấm'}</strong>
                        </Space>
                        <Input.TextArea
                            rows={4}
                            value={remark}
                            onChange={event => setRemark(event.target.value)}
                            maxLength={2000}
                            showCount
                            placeholder="Nhận xét về kỹ năng, kinh nghiệm, điểm cần hỏi thêm khi phỏng vấn…"
                        />
                        <Button
                            type="primary"
                            style={{ marginTop: 12 }}
                            loading={savingEvaluation}
                            onClick={saveEvaluation}
                        >
                            Lưu đánh giá
                        </Button>
                    </section>
                </Access>
            </Drawer>
            <InterviewModal
                open={interviewOpen}
                resume={dataInit}
                onClose={() => setInterviewOpen(false)}
                onDone={applied}
            />
            <DecisionModal
                open={decision !== null}
                target={decision ?? 'REJECTED'}
                resume={dataInit}
                onClose={() => setDecision(null)}
                onDone={applied}
            />
            <CvViewerModal
                open={viewingCv}
                endpoint={dataInit?.id ? `/api/v1/resumes/${dataInit.id}/document` : null}
                file={dataInit?.url}
                name={dataInit?.url}
                onClose={() => setViewingCv(false)}
            />
        </>
    );
};

export default ViewDetailResume;
