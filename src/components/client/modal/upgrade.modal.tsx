import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal, message } from 'antd';
import { CheckOutlined, ClockCircleOutlined, CloseOutlined, LockFilled } from '@ant-design/icons';
import { BsAwardFill, BsBullseye, BsStarFill } from 'react-icons/bs';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    callCreateOrder,
    callFetchMyPlan,
    callFetchPaymentMethods,
    callFetchPlans,
    callMockComplete,
    callVnpayReturn,
    callZalopayReturn,
    callMomoReturn,
} from '@/config/api';
import { DEFAULT_AVAILABLE, PAYMENT_METHODS, PaymentMethodCode, paymentLabel } from '@/config/payment-methods';
import { formatDate, formatVnd } from '@/config/utils';
import { useAppDispatch, useAppSelector, useIsEmployer } from '@/redux/hooks';
import { fetchMyPlanCode } from '@/redux/slice/planSlide';
import { ICreateOrder, IMyPlan, IPaymentResult, IPlan, PlanCode } from '@/types/backend';
import { errorText, useAuthModal } from '../auth';
import d from '@/styles/detail.module.scss';
import ui from '@/styles/client.module.scss';
import p from '@/styles/plans.module.scss';

const PLAN_TEXT: Record<PlanCode, { icon: ReactNode; intro: string }> = {
    BASIC: { icon: <BsAwardFill />, intro: 'Bắt đầu theo dõi việc làm mới.' },
    STANDARD: { icon: <BsBullseye />, intro: 'Cho người tìm việc thường xuyên.' },
    PREMIUM: { icon: <BsStarFill />, intro: 'Cho ứng viên muốn nổi bật.' },
};

export const planBenefits = (plan: IPlan) => [
    plan.alertSkills >= 100
        ? 'Nhận việc qua email, không giới hạn kỹ năng'
        : `${plan.alertSkills} kỹ năng nhận việc qua email`,
    plan.savedJobs >= 1000 ? 'Lưu việc làm không giới hạn' : `Lưu ${plan.savedJobs} việc làm quan tâm`,
    ...(plan.highlight ? ['Hồ sơ ứng tuyển có nhãn Premium'] : []),
];

const RETURN_PATH = 'payment-return-path';

const UPGRADE_Z = 1010;

const UpgradeContext = createContext<() => void>(() => undefined);
export const useUpgradeModal = () => useContext(UpgradeContext);

export const UpgradeModalProvider = ({ children }: { children: ReactNode }) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const accountLoading = useAppSelector(state => state.account.isLoading);
    const dispatch = useAppDispatch();
    const isEmployer = useIsEmployer();
    const openAuth = useAuthModal();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'plans' | 'payment' | 'mock'>('plans');
    const [mockOrder, setMockOrder] = useState<ICreateOrder | null>(null);
    const [result, setResult] = useState<IPaymentResult | { error: string } | null>(null);
    const handledReturn = useRef('');
    const [walletReturn, setWalletReturn] = useState<{ provider: 'zalopay' | 'momo'; txnRef: string } | null>(null);
    const [checking, setChecking] = useState(false);
    const [plans, setPlans] = useState<IPlan[]>([]);
    const [mine, setMine] = useState<IMyPlan | null>(null);
    const [selected, setSelected] = useState<IPlan | null>(null);
    const [paying, setPaying] = useState(false);
    const [method, setMethod] = useState<PaymentMethodCode>('VNPAY');
    const [available, setAvailable] = useState<Record<string, boolean>>(DEFAULT_AVAILABLE);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const openModal = useCallback(() => {
        if (!isAuthenticated) {
            openAuth('login');
            return;
        }
        if (isEmployer) {
            message.info('Gói Premium dành cho tài khoản ứng viên.');
            return;
        }
        setStep('plans');
        setSelected(null);
        setMethod('VNPAY');
        setOpen(true);
    }, [isAuthenticated, isEmployer, openAuth]);

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const [planRes, mineRes, methodRes] = await Promise.all([
                    callFetchPlans(),
                    callFetchMyPlan(),
                    callFetchPaymentMethods().catch(() => null),
                ]);
                setPlans(planRes.data ?? []);
                setMine(mineRes.data ?? null);
                if (methodRes?.data) {
                    const next = Object.fromEntries(methodRes.data.map(item => [item.code, item.available]));
                    setAvailable(next);
                    setMethod(current =>
                        next[current] ? current : (PAYMENT_METHODS.find(item => next[item.code])?.code ?? 'VNPAY'),
                    );
                }
            } catch {
                message.error('Chưa thể tải danh sách gói. Vui lòng thử lại.');
                setOpen(false);
            }
        })();
    }, [open]);

    const settle = useCallback(
        async (query: string) => {
            try {
                const res = await callVnpayReturn(query);
                setResult(res.data ?? { error: errorText(res, 'Không xác nhận được giao dịch.') });
                if (res.data?.outcome === 'SUCCESS') dispatch(fetchMyPlanCode());
            } catch {
                setResult({ error: 'Chưa thể kết nối để xác nhận giao dịch. Vui lòng tải lại trang.' });
            }
        },
        [dispatch],
    );

    const settleWallet = useCallback(
        async (provider: 'zalopay' | 'momo', txnRef: string) => {
            setChecking(true);
            setWalletReturn({ provider, txnRef });
            try {
                const res = await (provider === 'momo' ? callMomoReturn(txnRef) : callZalopayReturn(txnRef));
                setResult(res.data ?? { error: errorText(res, 'Chưa xác nhận được giao dịch.') });
                if (res.data?.outcome === 'SUCCESS') dispatch(fetchMyPlanCode());
            } catch {
                setResult({ error: 'Chưa kết nối được cổng thanh toán. Hãy kiểm tra lại đơn này.' });
            } finally {
                setChecking(false);
            }
        },
        [dispatch],
    );

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const provider = params.get('payment');
        if ((provider === 'zalopay' || provider === 'momo') && params.has('txnRef')) {
            if (accountLoading || handledReturn.current === location.search) return;
            if (!isAuthenticated) {
                openAuth('login');
                return;
            }
            handledReturn.current = location.search;
            const back = sessionStorage.getItem(RETURN_PATH) ?? '/';
            sessionStorage.removeItem(RETURN_PATH);
            navigate(back, { replace: true });
            settleWallet(provider, params.get('txnRef')!);
            return;
        }
        if (!location.search.includes('vnp_TxnRef') || !location.search.includes('vnp_SecureHash')) return;
        if (handledReturn.current === location.search) return;
        handledReturn.current = location.search;
        const back = sessionStorage.getItem(RETURN_PATH) ?? '/';
        sessionStorage.removeItem(RETURN_PATH);
        navigate(back, { replace: true });
        setWalletReturn(null);
        settle(location.search);
    }, [accountLoading, isAuthenticated, location.search, navigate, openAuth, settle, settleWallet]);

    useEffect(() => {
        if (accountLoading || !new URLSearchParams(location.search).has('goi')) return;
        navigate(location.pathname, { replace: true });
        openModal();
    }, [accountLoading, location.search, location.pathname, navigate, openModal]);

    const finishMock = async (success: boolean) => {
        if (!mockOrder) return;
        setPaying(true);
        try {
            const res = await callMockComplete(mockOrder.txnRef, success);
            const url = res.data?.returnUrl;
            if (!url) throw new Error();
            setOpen(false);
            setWalletReturn(null);
            await settle(url.slice(url.indexOf('?')));
        } catch {
            message.error('Không hoàn tất được giao dịch giả lập.');
        }
        setPaying(false);
    };

    const proceed = async () => {
        if (!selected) return;
        setPaying(true);
        try {
            const res = await callCreateOrder(selected.code, method);
            if (res.data?.mock) {
                setMockOrder(res.data);
                setStep('mock');
                setPaying(false);
                return;
            }
            if (res.data?.paymentUrl) {
                sessionStorage.setItem(RETURN_PATH, location.pathname + location.search);
                window.location.assign(res.data.paymentUrl);
                return;
            }
            message.error(errorText(res, 'Chưa thể tạo đơn thanh toán. Vui lòng thử lại.'));
        } catch {
            message.error('Chưa thể tạo đơn thanh toán. Vui lòng thử lại.');
        }
        setPaying(false);
    };

    return (
        <UpgradeContext.Provider value={openModal}>
            {children}
            <Modal
                zIndex={UPGRADE_Z}
                open={open && step === 'plans'}
                onCancel={() => setOpen(false)}
                footer={null}
                centered
                width={960}
                destroyOnClose
                className={p.plansModal}
            >
                <div className={p.plansHead}>
                    <h2>Gói Premium cho nhu cầu của bạn</h2>
                    <p>Thanh toán một lần, dùng trong 30 ngày. Không tự động gia hạn.</p>
                </div>
                <div className={p.planGrid}>
                    {plans.map(plan => {
                        const hot = plan.code === 'STANDARD';
                        const current = mine?.plan === plan.code;
                        return (
                            <article key={plan.code} className={`${p.planCard} ${hot ? p.planCardHot : ''}`}>
                                <div className={p.planPrice}>
                                    {formatVnd(plan.priceVnd)}
                                    <small>/ {plan.days} ngày</small>
                                </div>
                                <h3 className={p.planName}>{plan.name}</h3>
                                <p className={p.planDesc}>{PLAN_TEXT[plan.code].intro}</p>
                                <ul className={p.planList}>
                                    {planBenefits(plan).map(text => (
                                        <li key={text}>
                                            <CheckOutlined aria-hidden="true" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                                <span className={p.planBadge} aria-hidden="true">
                                    {PLAN_TEXT[plan.code].icon}
                                </span>
                                {current && mine?.expiresAt && (
                                    <span className={p.planCurrent}>Đang dùng · đến {formatDate(mine.expiresAt)}</span>
                                )}
                                <button
                                    type="button"
                                    className={p.planSelect}
                                    onClick={() => {
                                        setSelected(plan);
                                        setStep('payment');
                                    }}
                                >
                                    {current ? 'Gia hạn thêm 30 ngày' : 'Chọn gói'}
                                </button>
                            </article>
                        );
                    })}
                </div>
                <div className={p.planFoot}>
                    <p className={p.planFree}>Gói miễn phí: 3 kỹ năng nhận việc qua email, 20 việc làm đã lưu.</p>
                    <button type="button" className={p.planSkip} onClick={() => setOpen(false)}>
                        Bỏ qua
                    </button>
                </div>
            </Modal>

            <Modal
                zIndex={UPGRADE_Z}
                open={open && step === 'payment'}
                onCancel={() => !paying && setOpen(false)}
                footer={null}
                centered
                width={360}
                destroyOnClose
                className={p.payModal}
                closable={!paying}
                maskClosable={!paying}
            >
                {selected && (
                    <>
                        <div className={p.payHead}>
                            <span className={p.payLock}>
                                <LockFilled />
                            </span>
                            <h2>Thiết lập thanh toán</h2>
                            <p>
                                Gói {selected.name} · {selected.days} ngày
                            </p>
                        </div>
                        <div className={p.payMethods} role="radiogroup" aria-label="Phương thức thanh toán">
                            {PAYMENT_METHODS.map(item => {
                                const ok = available[item.code] ?? false;
                                return (
                                    <label key={item.code} className={p.payMethod}>
                                        <span className={p.payChip}>
                                            <img src={item.logo} alt="" loading="lazy" decoding="async" />
                                        </span>
                                        <span className={p.payName}>
                                            {item.label}
                                            {!ok && <small>Chưa khả dụng</small>}
                                        </span>
                                        <input
                                            type="radio"
                                            name="payment-method"
                                            value={item.code}
                                            checked={method === item.code}
                                            disabled={!ok || paying}
                                            onChange={() => setMethod(item.code)}
                                            className={p.payRadio}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <p className={p.payTotal}>Tổng cộng: {formatVnd(selected.priceVnd)}</p>
                        <button
                            type="button"
                            className={p.payProceed}
                            onClick={proceed}
                            disabled={paying || !available[method]}
                        >
                            {paying ? 'Đang chuyển tới cổng thanh toán…' : 'Tiếp tục thanh toán'}
                        </button>
                        <p className={p.payNote}>Hiệu lực 30 ngày, không tự động gia hạn.</p>
                        <div className={p.payFooter}>
                            <button type="button" onClick={() => setStep('plans')} disabled={paying}>
                                Quay lại
                            </button>
                            <button type="button" onClick={() => setOpen(false)} disabled={paying}>
                                Bỏ qua
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                zIndex={UPGRADE_Z}
                open={open && step === 'mock'}
                onCancel={() => !paying && setOpen(false)}
                footer={null}
                centered
                width={380}
                destroyOnClose
                className={p.mockModal}
                closable={!paying}
                maskClosable={false}
            >
                {selected && mockOrder && (
                    <>
                        <div className={p.mockHead}>
                            {paymentLabel(method).toUpperCase()} SANDBOX
                            <small>Cổng thanh toán giả lập để thử nghiệm</small>
                        </div>
                        <div className={p.mockBody}>
                            <p>Đây không phải cổng thật (backend đang bật PAYMENT_MOCK). Không có tiền nào bị trừ.</p>
                            <dl>
                                <dt>Gói</dt>
                                <dd>{selected.name}</dd>
                                <dt>Số tiền</dt>
                                <dd>{formatVnd(selected.priceVnd)}</dd>
                            </dl>
                            <div className={p.mockActions}>
                                <button
                                    type="button"
                                    className={ui.btnPrimary}
                                    disabled={paying}
                                    onClick={() => finishMock(true)}
                                >
                                    Thanh toán thành công
                                </button>
                                <button
                                    type="button"
                                    className={ui.btnOutline}
                                    disabled={paying}
                                    onClick={() => finishMock(false)}
                                >
                                    Hủy giao dịch
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                zIndex={UPGRADE_Z}
                open={result !== null || checking}
                onCancel={() => setResult(null)}
                closable={!checking}
                maskClosable={!checking}
                footer={null}
                centered
                width={360}
                destroyOnClose
                className={p.resultModal}
            >
                {checking && !result && (
                    <div className={p.resultBody} role="status">
                        <span className={p.failIcon}>
                            <ClockCircleOutlined />
                        </span>
                        <h2>Đang xác nhận thanh toán</h2>
                        <p>Vui lòng chờ kết quả từ cổng thanh toán.</p>
                    </div>
                )}
                {result &&
                    ('outcome' in result && result.outcome === 'SUCCESS' ? (
                        <div className={p.resultBody} role="status">
                            <span className={d.applyDoneIcon}>
                                <svg viewBox="0 0 52 52" aria-hidden="true">
                                    <path d="M15 27l8 8 15-17" />
                                </svg>
                            </span>
                            <h2>Tuyệt vời!</h2>
                            <h3>Thanh toán thành công</h3>
                            <p>
                                Gói{' '}
                                <strong>
                                    {result.order.plan.charAt(0) + result.order.plan.slice(1).toLowerCase()}
                                </strong>{' '}
                                đã được kích hoạt
                                {result.order.endsAt ? (
                                    <>
                                        , có hiệu lực đến <strong>{formatDate(result.order.endsAt)}</strong>
                                    </>
                                ) : null}
                                .
                            </p>
                            <div className={p.resultActions}>
                                <button type="button" className={ui.btnPrimary} onClick={() => setResult(null)}>
                                    Xong
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={p.resultBody} role="alert">
                            <span className={p.failIcon}>
                                {'outcome' in result && result.outcome === 'PENDING' ? (
                                    <ClockCircleOutlined />
                                ) : (
                                    <CloseOutlined />
                                )}
                            </span>
                            <h2>
                                {'outcome' in result && result.outcome === 'PENDING'
                                    ? 'Đang xác nhận thanh toán'
                                    : 'Chưa thanh toán xong'}
                            </h2>
                            <p>{'error' in result ? result.error : result.message}</p>
                            <div className={p.resultActions}>
                                <button
                                    type="button"
                                    className={ui.btnPrimary}
                                    disabled={checking}
                                    onClick={() => {
                                        if (walletReturn && ('error' in result || result.outcome === 'PENDING')) {
                                            settleWallet(walletReturn.provider, walletReturn.txnRef);
                                            return;
                                        }
                                        setResult(null);
                                        openModal();
                                    }}
                                >
                                    {checking
                                        ? 'Đang kiểm tra…'
                                        : walletReturn && ('error' in result || result.outcome === 'PENDING')
                                          ? 'Kiểm tra lại'
                                          : 'Thử lại'}
                                </button>
                                <button
                                    type="button"
                                    className={ui.btnOutline}
                                    disabled={checking}
                                    onClick={() => setResult(null)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    ))}
            </Modal>
        </UpgradeContext.Provider>
    );
};
