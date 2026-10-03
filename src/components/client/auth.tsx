import {
    createContext,
    lazy,
    MouseEvent,
    ReactNode,
    Suspense,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Skeleton, message, notification } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, FileDoneOutlined, MailOutlined, StarFilled } from '@ant-design/icons';
import { BsBookmarkFill } from 'react-icons/bs';
import { Link, LinkProps, useLocation, useNavigate } from 'react-router-dom';
import { callForgotPassword, callLogin, callRegister } from '@/config/api';
import { ASSETS } from '@/config/assets';
import { useReducedMotion } from '@/config/motion';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setUserLoginInfo } from '@/redux/slice/accountSlide';
import { AssetImage, Brand } from './decor';
import SocialLogin, { useOAuthError } from './social-login';
import a from '@/styles/auth.module.scss';

export type AuthMode = 'login' | 'register' | 'forgot';
export type EmployerMode = 'employer-login' | 'employer-register';
export type ModalMode = AuthMode | EmployerMode;
const AUTH_PATHS: Record<ModalMode, string> = {
    login: '/login',
    register: '/register',
    forgot: '/forgot-password',
    'employer-login': '/nha-tuyen-dung/dang-nhap',
    'employer-register': '/nha-tuyen-dung/dang-ky',
};
const EmployerCard = lazy(() => import('./employer-auth').then(module => ({ default: module.EmployerCard })));
export interface AuthPrefill {
    name?: string;
    email?: string;
}

const highlights = [
    {
        icon: <FileDoneOutlined />,
        title: 'Ứng tuyển chỉ với một CV',
        text: 'Tải CV một lần và gửi tới nhà tuyển dụng trong vài giây.',
    },
    {
        icon: <BsBookmarkFill />,
        title: 'Lưu việc làm yêu thích',
        text: 'Đánh dấu vị trí bạn quan tâm và quay lại bất cứ lúc nào.',
    },
    {
        icon: <StarFilled />,
        title: 'Đánh giá từ cộng đồng',
        text: 'Đọc trải nghiệm thật về công ty trước khi ứng tuyển.',
    },
    { icon: <MailOutlined />, title: 'Việc làm mới qua email', text: 'Chọn kỹ năng để nhận cơ hội phù hợp mỗi tuần.' },
];

export const errorText = (res: { message?: string | string[] } | undefined, fallback: string) =>
    (Array.isArray(res?.message) ? res?.message[0] : res?.message) || fallback;
export const notifyOffline = () =>
    notification.error({
        message: 'Không thể kết nối',
        description: 'Vui lòng kiểm tra kết nối mạng và thử lại.',
        duration: 5,
    });

export const useSignIn = () => {
    const dispatch = useAppDispatch();
    return async (username: string, password: string) => {
        const res = await callLogin(username, password);
        if (!res?.data) {
            notification.error({
                message: 'Chưa thể đăng nhập',
                description: errorText(res, 'Vui lòng kiểm tra email và mật khẩu của bạn.'),
                duration: 5,
            });
            return null;
        }
        localStorage.setItem('access_token', res.data.access_token);
        dispatch(setUserLoginInfo(res.data.user));
        return res.data.user;
    };
};

export const Highlights = ({ items = highlights }: { items?: typeof highlights }) => {
    const [slide, setSlide] = useState(0);
    const [paused, setPaused] = useState(false);
    const reduced = useReducedMotion();

    useEffect(() => {
        if (reduced || paused) return;
        const timer = window.setInterval(() => setSlide(value => (value + 1) % items.length), 5000);
        return () => window.clearInterval(timer);
    }, [paused, reduced, items.length]);

    return (
        <div className={a.highlights} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className={a.slideTrack} style={{ transform: `translateX(calc(${-slide} * (64% + 12px)))` }}>
                {items.map((item, index) => (
                    <div key={item.title} className={a.slide} aria-hidden={index !== slide}>
                        <span className={a.slideIcon}>{item.icon}</span>
                        <strong>{item.title}</strong>
                        <span>{item.text}</span>
                    </div>
                ))}
            </div>
            <div className={a.progress}>
                {items.map((item, index) => (
                    <button
                        key={item.title}
                        type="button"
                        onClick={() => setSlide(index)}
                        aria-label={`Xem: ${item.title}`}
                        aria-current={index === slide}
                    />
                ))}
            </div>
        </div>
    );
};

interface FormProps {
    prefill?: AuthPrefill;
    onSwitch: () => void;
    onSuccess?: () => void;
    onEmployer?: () => void;
    onForgot?: () => void;
}

const LoginForm = ({ prefill, onSwitch, onSuccess, onEmployer, onForgot }: FormProps) => {
    useOAuthError();
    const signIn = useSignIn();
    const [busy, setBusy] = useState(false);

    const onFinish = async ({ username, password }: { username: string; password: string }) => {
        setBusy(true);
        try {
            if (await signIn(username, password)) {
                message.success('Đăng nhập thành công!');
                onSuccess?.();
            }
        } catch {
            notifyOffline();
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <h1 className={a.title}>Chào mừng trở lại</h1>
            <p className={a.subtitle}>Đăng nhập để tiếp tục hành trình tìm việc của bạn.</p>
            <Form
                name="login"
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                className={a.form}
                initialValues={{ username: prefill?.email }}
            >
                <Form.Item
                    label="Email"
                    name="username"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email.' },
                        { type: 'email', message: 'Email chưa hợp lệ.' },
                    ]}
                >
                    <Input placeholder="ban@email.com" autoComplete="username" />
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
            <SocialLogin />
            <p className={a.switch}>
                Chưa có tài khoản?{' '}
                <button type="button" onClick={onSwitch}>
                    Đăng ký
                </button>
            </p>
            <p className={a.switchAlt}>
                Bạn là nhà tuyển dụng?{' '}
                <Link
                    to="/nha-tuyen-dung/dang-nhap"
                    onClick={event => {
                        if (onEmployer) {
                            event.preventDefault();
                            onEmployer();
                        }
                    }}
                >
                    Đăng nhập nhà tuyển dụng
                </Link>
            </p>
        </>
    );
};

const ForgotForm = ({ prefill, onSwitch }: FormProps) => {
    const [busy, setBusy] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);

    const onFinish = async ({ email }: { email: string }) => {
        setBusy(true);
        try {
            const res = await callForgotPassword(email.trim());
            if (+(res?.statusCode ?? 0) === 200) setSentTo(email.trim());
            else
                notification.error({
                    message: 'Chưa thể gửi liên kết',
                    description: errorText(res, 'Vui lòng kiểm tra email và thử lại.'),
                    duration: 5,
                });
        } catch {
            notifyOffline();
        } finally {
            setBusy(false);
        }
    };

    if (sentTo) {
        return (
            <div className={a.done}>
                <span className={a.doneIcon}>
                    <CheckOutlined />
                </span>
                <h2>Kiểm tra email của bạn</h2>
                <p>
                    Nếu <strong>{sentTo}</strong> đã đăng ký tài khoản, chúng tôi vừa gửi một liên kết đặt lại mật khẩu,
                    có hiệu lực trong 15 phút. Hãy xem cả thư mục thư rác nếu chưa thấy.
                </p>
                <Button type="primary" block className={a.submit} onClick={onSwitch}>
                    Quay lại đăng nhập
                </Button>
            </div>
        );
    }

    return (
        <>
            <h1 className={a.title}>Quên mật khẩu?</h1>
            <p className={a.subtitle}>Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt mật khẩu mới.</p>
            <Form
                name="forgot"
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                className={a.form}
                initialValues={{ email: prefill?.email }}
            >
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email.' },
                        { type: 'email', message: 'Email chưa hợp lệ.' },
                    ]}
                >
                    <Input placeholder="ban@email.com" autoComplete="email" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={busy} className={a.submit}>
                    Gửi liên kết đặt lại
                </Button>
            </Form>
            <p className={a.switch}>
                Nhớ ra mật khẩu rồi?{' '}
                <button type="button" onClick={onSwitch}>
                    Đăng nhập
                </button>
            </p>
        </>
    );
};

interface RegisterValues {
    name: string;
    email: string;
    age: number;
    gender: string;
    password: string;
    confirm: string;
}

const GENDERS = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

const RegisterForm = ({ prefill, onSwitch, onSuccess }: FormProps) => {
    const signIn = useSignIn();
    const [busy, setBusy] = useState(false);

    const onFinish = async ({ name, email, age, gender, password }: RegisterValues) => {
        setBusy(true);
        try {
            const res = await callRegister(name.trim(), email, password, age, gender);
            if (!res?.data?.id) {
                notification.error({
                    message: 'Chưa thể tạo tài khoản',
                    description: errorText(res, 'Vui lòng kiểm tra thông tin và thử lại.'),
                    duration: 5,
                });
            } else if (await signIn(email, password)) {
                message.success('Tạo tài khoản thành công!');
                onSuccess?.();
            }
        } catch {
            notifyOffline();
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <h1 className={a.title}>Tạo tài khoản</h1>
            <p className={a.subtitle}>Miễn phí, chỉ mất chưa tới một phút.</p>
            <Form<RegisterValues>
                name="register"
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                className={a.form}
                initialValues={{ name: prefill?.name, email: prefill?.email }}
            >
                <Form.Item
                    label="Họ và tên"
                    name="name"
                    rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' }]}
                >
                    <Input placeholder="Nguyễn Văn A" autoComplete="name" />
                </Form.Item>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email.' },
                        { type: 'email', message: 'Email chưa hợp lệ.' },
                    ]}
                >
                    <Input type="email" placeholder="ban@email.com" autoComplete="email" />
                </Form.Item>
                <div className={a.fieldRow}>
                    <Form.Item
                        label="Tuổi"
                        name="age"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tuổi.' },
                            { type: 'number', min: 15, max: 100, message: 'Tuổi từ 15 đến 100.' },
                        ]}
                    >
                        <InputNumber controls={false} precision={0} placeholder="Ví dụ: 22" />
                    </Form.Item>
                    <Form.Item
                        label="Giới tính"
                        name="gender"
                        rules={[{ required: true, message: 'Vui lòng chọn giới tính.' }]}
                    >
                        <Select options={GENDERS} placeholder="Chọn giới tính" />
                    </Form.Item>
                </div>
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
                    Tạo tài khoản
                </Button>
            </Form>
            <SocialLogin />
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
    mode: AuthMode;
    prefill?: AuthPrefill;
    onModeChange: (mode: AuthMode) => void;
    onSuccess?: () => void;
    onEmployer?: () => void;
}

const AuthCard = ({ mode, prefill, onModeChange, onSuccess, onEmployer }: CardProps) => (
    <div className={a.card}>
        <aside className={a.visual}>
            <AssetImage asset={ASSETS.auth} className={a.photo} />
            <Highlights />
        </aside>
        <section className={a.formSide}>
            <Brand className={a.brand} />
            {mode === 'login' && (
                <LoginForm
                    prefill={prefill}
                    onSuccess={onSuccess}
                    onEmployer={onEmployer}
                    onForgot={() => onModeChange('forgot')}
                    onSwitch={() => onModeChange('register')}
                />
            )}
            {mode === 'register' && (
                <RegisterForm prefill={prefill} onSuccess={onSuccess} onSwitch={() => onModeChange('login')} />
            )}
            {mode === 'forgot' && <ForgotForm prefill={prefill} onSwitch={() => onModeChange('login')} />}
        </section>
    </div>
);

const safeCallback = (callback: string | null) => {
    try {
        const target = new URL(callback || '/', window.location.origin);
        return target.origin === window.location.origin ? `${target.pathname}${target.search}${target.hash}` : '/';
    } catch {
        return '/';
    }
};

export const AuthPage = ({ mode }: { mode: AuthMode }) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const location = useLocation();
    const navigate = useNavigate();
    const callback = safeCallback(new URLSearchParams(location.search).get('callback'));

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, []);
    useEffect(() => {
        if (isAuthenticated) window.location.replace(callback);
    }, [isAuthenticated, callback]);

    return (
        <main className={a.page}>
            <Link to="/" className={a.back}>
                <ArrowLeftOutlined /> Về trang chủ
            </Link>
            <AuthCard
                mode={mode}
                prefill={location.state as AuthPrefill | undefined}
                onModeChange={next => navigate(`${AUTH_PATHS[next]}${location.search}`)}
            />
        </main>
    );
};

const AuthModalContext = createContext<(mode?: ModalMode, prefill?: AuthPrefill) => void>(() => undefined);
export const useAuthModal = () => useContext(AuthModalContext);

export const useAuthClick = (mode: ModalMode) => {
    const open = useAuthModal();
    return (event: MouseEvent<HTMLElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        open(mode);
    };
};

export const AuthLink = ({ mode, onClick, ...props }: Omit<LinkProps, 'to'> & { mode: ModalMode }) => {
    const authClick = useAuthClick(mode);
    return (
        <Link
            {...props}
            to={AUTH_PATHS[mode]}
            onClick={event => {
                onClick?.(event);
                authClick(event);
            }}
        />
    );
};

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<{ mode: ModalMode; prefill?: AuthPrefill } | null>(null);
    const { pathname } = useLocation();

    useEffect(() => {
        setState(null);
    }, [pathname]);

    const open = useCallback((mode: ModalMode = 'login', prefill?: AuthPrefill) => setState({ mode, prefill }), []);
    const close = () => setState(null);

    return (
        <AuthModalContext.Provider value={open}>
            {children}
            <Modal
                open={state !== null}
                onCancel={close}
                footer={null}
                width={760}
                centered
                destroyOnClose
                className={a.modal}
            >
                {state &&
                    (state.mode === 'employer-login' || state.mode === 'employer-register' ? (
                        <Suspense
                            fallback={
                                <div className={a.modalLoading}>
                                    <Skeleton active paragraph={{ rows: 8 }} />
                                </div>
                            }
                        >
                            <EmployerCard
                                mode={state.mode === 'employer-login' ? 'login' : 'register'}
                                onSuccess={close}
                                onModeChange={mode =>
                                    setState({ mode: mode === 'login' ? 'employer-login' : 'employer-register' })
                                }
                                onCandidate={() => setState({ mode: 'login' })}
                                onForgot={() => setState({ mode: 'forgot' })}
                            />
                        </Suspense>
                    ) : (
                        <AuthCard
                            mode={state.mode}
                            prefill={state.prefill}
                            onSuccess={close}
                            onEmployer={() => setState({ mode: 'employer-login' })}
                            onModeChange={mode => setState({ mode, prefill: state.prefill })}
                        />
                    ))}
            </Modal>
        </AuthModalContext.Provider>
    );
};
