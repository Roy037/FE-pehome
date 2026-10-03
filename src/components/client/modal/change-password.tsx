import { useState } from 'react';
import { Alert, Button, Form, Input, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { callChangePassword, callLogout } from '@/config/api';
import { useAppDispatch } from '@/redux/hooks';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { errorText } from '../auth';

interface Values {
    currentPassword: string;
    newPassword: string;
    confirm: string;
}

// Small modal for the signed-in user. Every session ends when the password changes, so afterwards we sign out here too.
const ChangePasswordModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [form] = Form.useForm<Values>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const close = () => {
        form.resetFields();
        setError('');
        onClose();
    };

    const onFinish = async ({ currentPassword, newPassword }: Values) => {
        setBusy(true);
        setError('');
        try {
            const res = await callChangePassword(currentPassword, newPassword);
            if (+(res?.statusCode ?? 0) !== 200) {
                setError(errorText(res, 'Chưa đổi được mật khẩu. Vui lòng thử lại.'));
                return;
            }
            await callLogout().catch(() => undefined);
            dispatch(setLogoutAction({}));
            close();
            message.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.');
            navigate('/login', { replace: true });
        } catch {
            setError('Không thể kết nối. Vui lòng thử lại.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            title="Đổi mật khẩu"
            open={open}
            onCancel={close}
            footer={null}
            centered
            width={380}
            destroyOnClose
            maskClosable={!busy}
            closable={!busy}
        >
            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
            <Form<Values> form={form} layout="vertical" requiredMark={false} onFinish={onFinish}>
                <Form.Item
                    label="Mật khẩu hiện tại"
                    name="currentPassword"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại.' }]}
                >
                    <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu mới"
                    name="newPassword"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
                        { min: 6, message: 'Tối thiểu 6 ký tự.' },
                    ]}
                >
                    <Input.Password placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                    label="Xác nhận mật khẩu mới"
                    name="confirm"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: 'Vui lòng nhập lại mật khẩu mới.' },
                        ({ getFieldValue }) => ({
                            validator: (_, value) =>
                                !value || getFieldValue('newPassword') === value
                                    ? Promise.resolve()
                                    : Promise.reject(new Error('Mật khẩu chưa khớp.')),
                        }),
                    ]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={busy}>
                    Đổi mật khẩu
                </Button>
            </Form>
        </Modal>
    );
};

export default ChangePasswordModal;
