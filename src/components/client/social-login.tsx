import { useEffect, useState } from 'react';
import { notification } from 'antd';
import { FaFacebook, FaLinkedin } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useLocation, useNavigate } from 'react-router-dom';
import { callFetchOAuthProviders, oauthStartUrl } from '@/config/api';
import a from '@/styles/auth.module.scss';

const PROVIDERS = [
    { code: 'GOOGLE', label: 'Google', icon: <FcGoogle /> },
    { code: 'FACEBOOK', label: 'Facebook', icon: <FaFacebook color="#1877F2" /> },
    { code: 'LINKEDIN', label: 'LinkedIn', icon: <FaLinkedin color="#0A66C2" /> },
] as const;

const ERRORS: Record<string, string> = {
    denied: 'Bạn đã hủy đăng nhập.',
    disabled: 'Cách đăng nhập này chưa được bật.',
    no_email: 'Tài khoản đó chưa chia sẻ email. Hãy cho phép truy cập email, hoặc đăng ký bằng email.',
    unverified_email: 'Email của tài khoản đó chưa được xác minh bởi nhà cung cấp.',
    locked: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
    unsupported_account: 'Tài khoản nhà tuyển dụng và quản trị viên đăng nhập bằng email và mật khẩu.',
    failed: 'Không thể đăng nhập lúc này. Vui lòng thử lại.',
};

export const useOAuthError = () => {
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const code = new URLSearchParams(search).get('oauth_error');
        if (!code) return;
        notification.error({ message: 'Chưa thể đăng nhập', description: ERRORS[code] ?? ERRORS.failed, duration: 6 });
        navigate(pathname, { replace: true });
    }, [search, pathname, navigate]);
};

const SocialLogin = () => {
    const { pathname, search } = useLocation();
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});

    useEffect(() => {
        (async () => {
            try {
                const res = await callFetchOAuthProviders();
                setEnabled(Object.fromEntries((res.data ?? []).map(p => [p.code, p.enabled])));
            } catch {}
        })();
    }, []);

    const next = ['/login', '/register'].includes(pathname) ? '/' : pathname + search;

    return (
        <div className={a.social}>
            <div className={a.socialOr}>
                <span>Hoặc</span>
            </div>
            <div className={a.socialRow}>
                {PROVIDERS.map(item => (
                    <button
                        key={item.code}
                        type="button"
                        className={a.socialBtn}
                        disabled={!enabled[item.code]}
                        aria-label={`Tiếp tục với ${item.label}`}
                        title={enabled[item.code] ? `Tiếp tục với ${item.label}` : `${item.label}: chưa bật`}
                        onClick={() => window.location.assign(oauthStartUrl(item.code, next))}
                    >
                        {item.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SocialLogin;
