import { useState } from 'react';
import { Form, Input, Modal, Radio, message } from 'antd';
import { callReportJob } from '@/config/api';
import { JOB_REPORT_REASONS } from '@/config/utils';

interface IProps {
    open: boolean;
    onClose: () => void;
    jobId?: string | number;
    jobName: string;
}

const ReportJobModal = ({ open, onClose, jobId, jobName }: IProps) => {
    const [form] = Form.useForm<{ reason: string; detail?: string }>();
    const [submitting, setSubmitting] = useState(false);

    const submit = async ({ reason, detail }: { reason: string; detail?: string }) => {
        setSubmitting(true);
        try {
            const res = await callReportJob(String(jobId), reason, detail?.trim());
            if (+res.statusCode === 201) {
                message.success('Đã gửi báo cáo. Cảm ơn bạn đã giúp itjobs giữ cộng đồng an toàn.');
                form.resetFields();
                onClose();
            } else {
                message.error(
                    Array.isArray(res.message)
                        ? res.message[0]
                        : res.message || 'Chưa thể gửi báo cáo. Vui lòng thử lại.',
                );
            }
        } catch {
            message.error('Chưa thể gửi báo cáo. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Báo cáo tin tuyển dụng"
            open={open}
            onCancel={onClose}
            okText="Gửi báo cáo"
            cancelText="Hủy"
            onOk={() => form.submit()}
            confirmLoading={submitting}
            destroyOnClose
            centered
        >
            <p style={{ marginBottom: 16 }}>
                Bạn đang báo cáo tin <strong>{jobName}</strong>. Quản trị viên sẽ xem xét báo cáo.
            </p>
            <Form form={form} layout="vertical" onFinish={submit} preserve={false}>
                <Form.Item
                    name="reason"
                    label="Lý do"
                    rules={[{ required: true, message: 'Vui lòng chọn lý do báo cáo' }]}
                >
                    <Radio.Group options={JOB_REPORT_REASONS} style={{ display: 'grid', gap: 8 }} />
                </Form.Item>
                <Form.Item name="detail" label="Chi tiết (không bắt buộc)">
                    <Input.TextArea
                        rows={3}
                        maxLength={1000}
                        showCount
                        placeholder="Mô tả ngắn gọn vấn đề bạn gặp phải"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ReportJobModal;
