import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { callRefreshToken } from '@/config/api';
import { useAppDispatch } from '@/redux/hooks';
import { setUserLoginInfo } from '@/redux/slice/accountSlide';
import Loading from '@/components/share/loading';
import { OAuthNext } from '@/config/utils';

// Where the server sends the browser after a successful Google / Facebook / LinkedIn sign-in. It already set the
// refresh-token cookie; exchanging that for an access token is the same call a page reload makes.
const OAuthCompletePage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [params] = useSearchParams();
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        (async () => {
            try {
                const res = await callRefreshToken();
                const data = res?.data;
                if (!data?.access_token) throw new Error();
                localStorage.setItem('access_token', data.access_token);
                dispatch(setUserLoginInfo(data.user));
                message.success('Đăng nhập thành công!');
                navigate(OAuthNext(params.get('next')), { replace: true });
            } catch {
                navigate('/login?oauth_error=failed', { replace: true });
            }
        })();
    }, [dispatch, navigate, params]);

    return <Loading />;
};

export default OAuthCompletePage;
