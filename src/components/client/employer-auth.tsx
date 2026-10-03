import { useEffect, useState } from 'react';
import { Button, Form, Input, message, notification } from 'antd';
import {
    ArrowLeftOutlined,
    BankOutlined,
    CheckOutlined,
    FormOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { callRegisterEmployer } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { AssetImage, Brand } from './decor';
import { Highlights, errorText, notifyOffline, useSignIn } from './auth';
import a from '@/styles/auth.module.scss';

export type EmployerCardMode = 'login' | 'register';
type Mode = EmployerCardMode;

const highlights = [
    {
        icon: <FormOutlined />,
        title: 'Đăng tin trong vài phút',
        text: 'Nêu rõ kỹ năng, mức lương và hình thức làm việc để ứng viên phù hợp tìm đến.',
    },
    {
        icon: <TeamOutlined />,
        title: 'Quản lý hồ sơ ứng viên',
        text: 'Xem CV và cập nhật trạng thái ứng tuyển ngay trên một màn hình.',
    },
    {
        icon: <BankOutlined />,
        title: 'Thương hiệu công ty',
        text: 'Trang công ty với logo, mô tả và đánh giá từ cộng đồng.',
    },
    {
        icon: <SafetyCertificateOutlined />,
        title: 'Được xét duyệt',
        text: 'Công ty được quản trị viên xác minh trước khi đăng tin.',
    },
];

interface FormProps {
    onSwitch: () => void;
    onCandidate?: () => void;
    onSuccess?: () => void;
    onForgot?: () => void;
}

const LoginForm = ({ onSwitch, onCandidate, onSuccess, onForgot }: FormProps) => {
    const navigate = useNavigate();
    const signIn = useSignIn();
    const [busy, setBusy] = useState(false);

    const onFinish = async ({ username, password }: { username: string; password: string }) => {
        setBusy(true);
        try {
            const user = await signIn(username, password);
            if (!user) return;
            if (user.company || user.role?.permissions?.length) {
                message.success('Đăng nhập thành công!');
                navigate('/admin');
            } else message.info('Đây là tài khoản ứng viên. Hãy đăng ký nhà tuyển dụng để đăng tin.');
            onSuccess?.();
        } catch {
            notifyOffline();
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <span className={a.badge}>Dành cho nhà tuyển dụng</span>
            <h1 className={a.title}>Đăng nhập nhà tuyển dụng</h1>
            <p className={a.subtitle}>Quản lý tin tuyển dụng và hồ sơ ứng viên của công ty bạn.</p>
            <Form name="employer-login" layout="vertical" requiredMark={false} onFinish={onFinish} className={a.form}>
                <Form.Item
                    label="Email công việc"
                    name="username"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email.' },
                        { type: 'email', message: 'Email chưa hợp lệ.' },
                    ]}
                >
                    <Input placeholder="hr@congty.com" autoComplete="username" />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
                >
                    <Input.Password placeholder="Nhập mật khẩu" autoComplete="current-password" />
                </Form.Item>
                {onForgot && (
                    <div className={a.forgotRow}>
                        <button type="button" onClick={onForgot}>
                            Quên mật khẩu?
                        </button>
                    </div>
                )}
                <Button type="primary" htmlType="submit" block loading={busy} className={a.submit}>
                    Đăng nhập
                </Button>
            </Form>
            <p className={a.switch}>
                Công ty chưa có tài khoản?{' '}
                <button type="button" onClick={onSwitch}>
                    Đăng ký nhà tuyển dụng
                </button>
            </p>
            {onCandidate && (
                <p className={a.switchAlt}>
                    Bạn là ứng viên?{' '}
                    <button type="button" onClick={onCandidate}>
                        Đăng nhập ứng viên
                    </button>
                </p>
            )}
        </>
    );
};

interface RegisterValues {
    companyName: string;
    companyAddress: string;
    name: string;
    email: string;
    password: string;
    confirm: string;
}

const RegisterForm = ({ onSwitch }: Pick<FormProps, 'onSwitch'>) => {
    const [busy, setBusy] = useState(false);
    const [sentFor, setSentFor] = useState<string | null>(null);

    const onFinish = async (values: RegisterValues) => {
        setBusy(true);
        try {
            const res = await callRegisterEmployer({
                companyName: values.companyName.trim(),
                companyAddress: values.companyAddress.trim(),
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
            });
            if (res?.data?.id) setSentFor(values.companyName.trim());
            else
                notification.error({
                    message: 'Chưa thể đăng ký',
                    description: errorText(res, 'Vui lòng kiểm tra thông tin và thử lại.'),
                    duration: 5,
                });
        } catch {
            notifyOffline();
        } finally {
            setBusy(false);
        }
    };

    if (sentFor) {
        return (
            <div className={a.done}>
                <span className={a.doneIcon}>
                    <CheckOutlined />
                </span>
                <h2>Đã gửi đăng ký</h2>
                <p>
                    Công ty <strong>{sentFor}</strong> đang chờ quản trị viên duyệt. Bạn có thể đăng nhập ngay để hoàn
                    thiện thông tin công ty; tính năng đăng tin sẽ mở sau khi công ty được duyệt.
                </p>
                <Button type="primary" block className={a.submit} onClick={onSwitch}>
                    Đăng nhập nhà tuyển dụng
                </Button>
            </div>
        );
    }

    return (
        <>
            <span className={a.badge}>Dành cho nhà tuyển dụng</span>
            <h1 className={a.title}>Đăng ký nhà tuyển dụng</h1>
            <p className={a.subtitle}>Tạo tài khoản cho công ty và bắt đầu đăng tin tuyển dụng.</p>
            <Form<RegisterValues>
                name="employer-register"
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                className={a.form}
            >
                <p className={a.groupTitle}>Thông tin công ty</p>
                <Form.Item
                    label="Tên công ty"
                    name="companyName"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập tên công ty.' },
                        { max: 120, message: 'Tối đa 120 ký tự.' },
                    ]}
                >
                    <Input placeholder="Công ty TNHH ABC" autoComplete="organization" />
                </Form.Item>
                <Form.Item
                    label="Địa chỉ"
                    name="companyAddress"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập địa chỉ.' },
                        { max: 255, message: 'Tối đa 255 ký tự.' },
                    ]}
                >
                    <Input placeholder="Quận, thành phố" autoComplete="street-address" />
                </Form.Item>
                <p className={a.groupTitle}>Tài khoản liên hệ</p>
                <Form.Item
                    label="Họ tên người liên hệ"
                    name="name"
                    rules={[
                        { required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' },
                        { max: 100, message: 'Tối đa 100 ký tự.' },
                    ]}
                >
                    <Input placeholder="Nguyễn Văn A" autoComplete="name" />
                </Form.Item>
                <Form.Item
                    label="Email công việc"
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email.' },
                        { type: 'email', message: 'Email chưa hợp lệ.' },
                    ]}
                >
                    <Input type="email" placeholder="hr@congty.com" autoComplete="email" />
                </Form.Item>
                <div className={a.fieldRow}>
                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu.' },
                            { min: 6, message: 'Tối thiểu 6 ký tự.' },
                        ]}
                    >
                        <Input.Password placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                        label="Xác nhận mật khẩu"
                        name="confirm"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng nhập lại mật khẩu.' },
                            ({ getFieldValue }) => ({
                                validator: (_, value) =>
                                    !value || getFieldValue('password') === value
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('Mật khẩu chưa khớp.')),
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Nhập lại" autoComplete="new-password" />
                    </Form.Item>
                </div>
                <Button type="primary" htmlType="submit" block loading={busy} className={a.submit}>
                    Gửi đăng ký
                </Button>
            </Form>
            <p className={a.switch}>
                Đã có tài khoản?{' '}
                <button type="button" onClick={onSwitch}>
                    Đăng nhập
                </button>
            </p>
        </>
    );
};

interface CardProps {
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    onCandidate?: () => void;
    onSuccess?: () => void;
    onForgot?: () => void;
}

export const EmployerCard = ({ mode, onModeChange, onCandidate, onSuccess, onForgot }: CardProps) => (
    <div className={a.card}>
        <aside className={a.visual}>
            <AssetImage asset={{ src: '/images/employer-team.webp' }} className={`${a.photo} ${a.photoTeam}`} />
            <Highlights items={highlights} />
        </aside>
        <section className={a.formSide}>
            <Brand className={a.brand} />
            {mode === 'login' ? (
                <LoginForm
                    onSwitch={() => onModeChange('register')}
                    onCandidate={onCandidate}
                    onSuccess={onSuccess}
                    onForgot={onForgot}
                />
            ) : (
                <RegisterForm onSwitch={() => onModeChange('login')} />
            )}
        </section>
    </div>
);

export const EmployerAuthPage = ({ mode }: { mode: Mode }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAppSelector(state => state.account);
    const canManage = Boolean(user.company) || Boolean(user.role?.permissions?.length);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [mode]);
    useEffect(() => {
        if (mode === 'login' && isAuthenticated) navigate(canManage ? '/admin' : '/', { replace: true });
    }, [mode, isAuthenticated, canManage, navigate]);

    return (
        <main className={a.page}>
            <Link to="/" className={a.back}>
                <ArrowLeftOutlined /> Về trang chủ
            </Link>
            <EmployerCard
                mode={mode}
                onCandidate={() => navigate('/login')}
                onForgot={() => navigate('/forgot-password')}
                onModeChange={next =>
                    navigate(next === 'login' ? '/nha-tuyen-dung/dang-nhap' : '/nha-tuyen-dung/dang-ky')
                }
            />
        </main>
    );
};
