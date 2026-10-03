import { useState } from 'react';
import { Checkbox, DatePicker, Form, Input, Modal, message, notification } from 'antd';
import dayjs from 'dayjs';
import { callChangeResumeStatus } from '@/config/api';
import { errorMessage } from '@/config/utils';
import { IResume } from '@/types/backend';

interface IProps {
    open: boolean;
    resume: IResume | null;
    onClose: () => void;
    // receives the updated application
    onDone: (resume: IResume) => void;
}

const submitChange = async (id: string, change: Parameters<typeof callChangeResumeStatus>[1]) => {
    const res = await callChangeResumeStatus(id, change);
    if (!res.data) {
        notification.error({ message: 'Chưa thể cập nhật hồ sơ', description: errorMessage(res.message) });
        return null;
    }
    return res.data;
};

// "Mời phỏng vấn" (also used to reschedule): date + time, https meeting link, optional note, optional e-mail.
export const InterviewModal = ({ open, resume, onClose, onDone }: IProps) => {
    const [form] = Form.useForm();
    const [busy, setBusy] = useState(false);
    const rescheduling = resume?.status === 'INTERVIEW';

    const onFinish = async (values: {
        interviewAt: dayjs.Dayjs;
        meetingLink: string;
        decisionNote?: string;
        notify: boolean;
    }) => {
        if (!resume?.id) return;
        setBusy(true);
        const updated = await submitChange(resume.id, {
            status: 'INTERVIEW',
            interviewAt: values.interviewAt.toISOString(),
            meetingLink: values.meetingLink.trim(),
            decisionNote: values.decisionNote?.trim() || undefined,
            notify: values.notify,
        });
        setBusy(false);
        if (!updated) return;
        message.success(rescheduling ? 'Đã cập nhật lịch phỏng vấn.' : 'Đã gửi lời mời phỏng vấn.');
        onDone(updated);
    };

    return (
        <Modal
            open={open}
            title={rescheduling ? 'Đổi lịch phỏng vấn' : 'Mời phỏng vấn'}
            okText={rescheduling ? 'Cập nhật lịch' : 'Gửi lời mời'}
            cancelText="Hủy"
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={busy}
            destroyOnClose
            maskClosable={false}
            afterClose={() => form.resetFields()}
        >
            <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
                Ứng viên <strong>{resume?.user?.name ?? resume?.email}</strong> · {resume?.job?.name}
            </p>
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                initialValues={{
                    notify: true,
                    interviewAt: rescheduling && resume?.interviewAt ? dayjs(resume.interviewAt) : undefined,
                    meetingLink: rescheduling ? (resume?.meetingLink ?? undefined) : undefined,
                }}
            >
                <Form.Item
                    label="Thời gian phỏng vấn"
                    name="interviewAt"
                    rules={[
                        { required: true, message: 'Vui lòng chọn thời gian phỏng vấn.' },
                        {
                            validator: (_, value) =>
                                !value || value.isAfter(dayjs())
                                    ? Promise.resolve()
                                    : Promise.reject(new Error('Thời gian phải ở tương lai.')),
                        },
                    ]}
                >
                    <DatePicker
                        showTime={{ format: 'HH:mm', minuteStep: 5 }}
                        format="DD/MM/YYYY HH:mm"
                        style={{ width: '100%' }}
                        placeholder="Chọn ngày và giờ"
                        disabledDate={current => current.isBefore(dayjs().startOf('day'))}
                    />
                </Form.Item>
                <Form.Item
                    label="Liên kết họp (Google Meet, Zoom, Teams…)"
                    name="meetingLink"
                    rules={[
                        { required: true, message: 'Vui lòng nhập liên kết họp.' },
                        { pattern: /^https:\/\/\S+$/, message: 'Liên kết phải bắt đầu bằng https://' },
                        { max: 500, message: 'Tối đa 500 ký tự.' },
                    ]}
                >
                    <Input placeholder="https://meet.google.com/abc-defg-hij" />
                </Form.Item>
                <Form.Item
                    label="Lời nhắn cho ứng viên (không bắt buộc)"
                    name="decisionNote"
                    rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}
                >
                    <Input.TextArea
                        rows={3}
                        showCount
                        maxLength={1000}
                        placeholder="Ví dụ: mang theo CV bản in, chuẩn bị giới thiệu bản thân…"
                    />
                </Form.Item>
                <Form.Item name="notify" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox>Gửi email thông báo cho ứng viên</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};

// "Nhận ứng viên" / "Từ chối": optional message for the candidate, optional e-mail.
export const DecisionModal = ({
    open,
    resume,
    target,
    onClose,
    onDone,
}: IProps & { target: 'ACCEPTED' | 'REJECTED' }) => {
    const [form] = Form.useForm();
    const [busy, setBusy] = useState(false);
    const accept = target === 'ACCEPTED';

    const onFinish = async (values: { decisionNote?: string; notify: boolean }) => {
        if (!resume?.id) return;
        setBusy(true);
        const updated = await submitChange(resume.id, {
            status: target,
            decisionNote: values.decisionNote?.trim() || undefined,
            notify: values.notify,
        });
        setBusy(false);
        if (!updated) return;
        message.success(accept ? 'Đã nhận ứng viên.' : 'Đã từ chối hồ sơ.');
        onDone(updated);
    };

    return (
        <Modal
            open={open}
            title={accept ? 'Nhận ứng viên' : 'Từ chối hồ sơ'}
            okText={accept ? 'Xác nhận nhận' : 'Xác nhận từ chối'}
            okButtonProps={{ danger: !accept }}
            cancelText="Hủy"
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={busy}
            destroyOnClose
            maskClosable={false}
            afterClose={() => form.resetFields()}
        >
            <p style={{ marginBottom: 16, color: 'var(--muted)' }}>
                {accept ? 'Nhận' : 'Từ chối'} ứng viên <strong>{resume?.user?.name ?? resume?.email}</strong> cho vị trí{' '}
                {resume?.job?.name}. Quyết định này là cuối cùng.
            </p>
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                initialValues={{ notify: true }}
            >
                <Form.Item
                    label={
                        accept
                            ? 'Lời nhắn cho ứng viên (không bắt buộc)'
                            : 'Lý do / lời nhắn cho ứng viên (không bắt buộc)'
                    }
                    name="decisionNote"
                    rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}
                >
                    <Input.TextArea
                        rows={4}
                        showCount
                        maxLength={1000}
                        placeholder={
                            accept
                                ? 'Ví dụ: chào mừng bạn! Bộ phận nhân sự sẽ liên hệ về thủ tục nhận việc.'
                                : 'Ví dụ: hồ sơ chưa phù hợp với yêu cầu kinh nghiệm hiện tại.'
                        }
                    />
                </Form.Item>
                <Form.Item name="notify" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox>Gửi email thông báo cho ứng viên</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};
