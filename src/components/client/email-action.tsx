import { useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { callUnsubscribe, callVerifyEmail } from '@/config/api';
import { ASSETS } from '@/config/assets';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import { AssetImage, Brand } from './decor';
import { Highlights, errorText, notifyOffline } from './auth';
import a from '@/styles/auth.module.scss';

type Mode = 'verify' | 'unsubscribe';

const TEXT: Record<Mode, { title: string; wait: string; done: string; doneText: string; fail: string }> = {
    verify: {
        title: 'Xác thực email',
        wait: 'Đang xác thực email của bạn…',
        done: 'Email đã được xác thực',
        doneText: 'Cảm ơn bạn. Giờ bạn có thể ứng tuyển và nhận việc làm qua email.',
        fail: 'Không thể xác thực email',
    },
    unsubscribe: {
        title: 'Hủy nhận bản tin',
        wait: 'Đang hủy đăng ký…',
        done: 'Bạn đã hủy nhận bản tin việc làm',
        doneText:
            'Chúng tôi sẽ không gửi bản tin hằng tuần cho địa chỉ này nữa. Bạn có thể đăng ký lại bất cứ lúc nào trong tài khoản.',
        fail: 'Không thể hủy đăng ký',
    },
};

const EmailAction = ({ mode }: { mode: Mode }) => {
    const dispatch = useAppDispatch();
    const signedIn = useAppSelector(state => state.account.isAuthenticated);
    const [params] = useSearchParams();
    const [token] = useState(params.get('token') ?? '');
    const [state, setState] = useState<'working' | 'done' | 'error'>(token ? 'working' : 'error');
    const [error, setError] = useState(token ? '' : 'Liên kết không hợp lệ.');
    const started = useRef(false);
    const text = TEXT[mode];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        if (!token || started.current) return;
        started.current = true;
        window.history.replaceState(null, '', window.location.pathname);
        (async () => {
            try {
                const res = await (mode === 'verify' ? callVerifyEmail(token) : callUnsubscribe(token));
                if (+(res?.statusCode ?? 0) === 200) {
                    setState('done');
                    if (mode === 'verify' && signedIn) dispatch(fetchAccount());
                } else {
                    setError(errorText(res, text.fail));
                    setState('error');
                }
            } catch {
                notifyOffline();
                setError('Không thể kết nối. Vui lòng thử lại.');
                setState('error');
            }
        })();
    }, [token, mode, signedIn, dispatch, text.fail]);

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
                    <h1 className={a.title}>{text.title}</h1>
                    {state === 'working' && <p className={a.subtitle}>{text.wait}</p>}
                    {state === 'done' && (
                        <Alert type="success" showIcon message={text.done} description={text.doneText} />
                    )}
                    {state === 'error' && (
                        <Alert
                            type="error"
                            showIcon
                            message={error || text.fail}
                            description={
                                mode === 'verify'
                                    ? 'Liên kết có thể đã hết hạn. Đăng nhập rồi bấm “Gửi lại” ở đầu trang để nhận email mới.'
                                    : 'Bạn cũng có thể hủy đăng ký trong tài khoản, mục “Nhận việc làm qua email”.'
                            }
                        />
                    )}
                    <Link to={signedIn ? '/' : '/login'}>
                        <Button type="primary" block className={a.submit} style={{ marginTop: 16 }}>
                            {signedIn ? 'Về trang chủ' : 'Đăng nhập'}
                        </Button>
                    </Link>
                </section>
            </div>
        </main>
    );
};

export default EmailAction;
