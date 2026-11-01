import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { callResetPassword } from '@/config/api';
import { ASSETS } from '@/config/assets';
import { AssetImage, Brand } from './decor';
import { Highlights, errorText, notifyOffline } from './auth';
import a from '@/styles/auth.module.scss';

interface Values {
    newPassword: string;
    confirm: string;
}

const ResetPassword = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [token] = useState(params.get('token') ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        if (token) window.history.replaceState(null, '', '/reset-password');
    }, [token]);

    const onFinish = async ({ newPassword }: Values) => {
        setBusy(true);
        setError('');
        try {
            const res = await callResetPassword(token, newPassword);
            if (+(res?.statusCode ?? 0) === 200) {
                message.success('Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.');
                navigate('/login', { replace: true });
            } else {
                setError(errorText(res, 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'));
            }
        } catch {
            notifyOffline();
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className={a.page}>
            <Link to="/" className={a.back}>
                <ArrowLeftOutlined /> Về trang chủ
            </Link>
            <div className={a.card}>
                <aside className={a.visual}>
                    <AssetImage asset={ASSETS.auth} className={a.photo} />
                    <Highlights />
                </aside>
                <section className={a.formSide}>
                    <Brand className={a.brand} />
                    <h1 className={a.title}>Đặt lại mật khẩu</h1>
                    <p className={a.subtitle}>Chọn mật khẩu mới cho tài khoản của bạn.</p>
                    {!token ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Liên kết không hợp lệ"
                            description={
                                <>
                                    Hãy <Link to="/forgot-password">yêu cầu liên kết mới</Link> từ trang đăng nhập.
                                </>
                            }
                        />
                    ) : (
                        <>
                            {error && (
                                <Alert
                                    type="error"
                                    showIcon
                                    message={error}
                                    description={
                                        <>
                                            Bạn có thể <Link to="/forgot-password">yêu cầu liên kết mới</Link>.
                                        </>
                                    }
                                    style={{ marginBottom: 16 }}
                                />
                            )}
                            <Form<Values>
                                name="reset-password"
                                layout="vertical"
                                requiredMark={false}
                                onFinish={onFinish}
                                className={a.form}
                            >
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
                                    label="Xác nhận mật khẩu"
                                    name="confirm"
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập lại mật khẩu.' },
                                        ({ getFieldValue }) => ({
                                            validator: (_, value) =>
                                                !value || getFieldValue('newPassword') === value
                                                    ? Promise.resolve()
                                                    : Promise.reject(new Error('Mật khẩu chưa khớp.')),
                                        }),
                                    ]}
                                >
                                    <Input.Password placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" block loading={busy} className={a.submit}>
                                    Đặt lại mật khẩu
                                </Button>
                            </Form>
                        </>
                    )}
                    <p className={a.switch}>
                        <Link to="/login">Quay lại đăng nhập</Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

export default ResetPassword;
