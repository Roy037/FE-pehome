import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Modal, Progress, Radio, Result, Skeleton, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LockOutlined, PushpinOutlined } from '@ant-design/icons';
import {
    callCreateEmployerOrder,
    callFetchEmployerServices,
    callFetchJob,
    callFetchPaymentMethods,
    callMockComplete,
    callMomoReturn,
    callVnpayReturn,
    callZalopayReturn,
} from '@/config/api';
import { DEFAULT_AVAILABLE, PAYMENT_METHODS, PaymentMethodCode, paymentLabel } from '@/config/payment-methods';
import { formatDate, formatVnd } from '@/config/utils';
import { errorText } from '@/components/client/auth';
import { useAppSelector } from '@/redux/hooks';
import { EmployerProductCode, IEmployerServices, IJob, IOrder, IPaymentResult } from '@/types/backend';

type Product = IEmployerServices['products'][number];
// what is being paid for: a product, and the job for a pin
interface Purchase {
    product: Product;
    job?: { id: string | number; name: string };
}

const STATUS: Record<IOrder['status'], { label: string; color: string }> = {
    PENDING: { label: 'Chờ thanh toán', color: 'gold' },
    PAID: { label: 'Đã thanh toán', color: 'green' },
    FAILED: { label: 'Thất bại', color: 'red' },
    EXPIRED: { label: 'Hết hạn thanh toán', color: 'default' },
};

const ServicePage = () => {
    const company = useAppSelector(state => state.account.user.company);
    const location = useLocation();
    const navigate = useNavigate();
    const [data, setData] = useState<IEmployerServices | null>(null);
    const [failed, setFailed] = useState(false);
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [method, setMethod] = useState<PaymentMethodCode>('VNPAY');
    const [available, setAvailable] = useState<Record<string, boolean>>(DEFAULT_AVAILABLE);
    const [paying, setPaying] = useState(false);
    const [mock, setMock] = useState<string | null>(null); // txnRef of the fake-gateway order
    const [result, setResult] = useState<IPaymentResult | { error: string } | null>(null);
    const [checking, setChecking] = useState(false);
    const handled = useRef('');

    const load = useCallback(async () => {
        try {
            const res = await callFetchEmployerServices();
            if (res.data) setData(res.data);
            else setFailed(true);
            if (company?.id) {
                const list = await callFetchJob(
                    new URLSearchParams({
                        page: '1',
                        size: '100',
                        sort: 'updatedAt,desc',
                        filter: `company.id : ${company.id} and active : true and locked : false`,
                    }).toString(),
                );
                setJobs(list.data?.result ?? []);
            }
        } catch {
            setFailed(true);
        }
    }, [company?.id]);

    useEffect(() => {
        load();
        (async () => {
            try {
                const res = await callFetchPaymentMethods();
                if (res.data) {
                    const next = Object.fromEntries(res.data.map(item => [item.code, item.available]));
                    setAvailable(next);
                    setMethod(PAYMENT_METHODS.find(item => next[item.code])?.code ?? 'VNPAY');
                }
            } catch {
                // the methods stay unavailable
            }
        })();
    }, [load]);

    // The gateway sends the browser back here with the answer in the address; confirm it with the server, show the
    // outcome and clean the address.
    useEffect(() => {
        if (handled.current === location.search) return;
        const params = new URLSearchParams(location.search);
        const provider = params.get('payment');
        const vnpay = location.search.includes('vnp_TxnRef') && location.search.includes('vnp_SecureHash');
        const wallet = (provider === 'zalopay' || provider === 'momo') && params.has('txnRef');
        if (!vnpay && !wallet) return;
        handled.current = location.search;
        setChecking(true);
        (async () => {
            try {
                const res = wallet
                    ? await (provider === 'momo'
                          ? callMomoReturn(params.get('txnRef')!)
                          : callZalopayReturn(params.get('txnRef')!))
                    : await callVnpayReturn(location.search);
                setResult(res.data ?? { error: errorText(res, 'Chưa xác nhận được giao dịch.') });
                if (res.data?.outcome === 'SUCCESS') load();
            } catch {
                setResult({ error: 'Chưa kết nối được để xác nhận giao dịch. Hãy tải lại trang.' });
            } finally {
                setChecking(false);
                navigate(location.pathname, { replace: true });
            }
        })();
    }, [location.search, location.pathname, navigate, load]);

    const proceed = async () => {
        if (!purchase) return;
        setPaying(true);
        try {
            const res = await callCreateEmployerOrder(purchase.product.code, method, purchase.job?.id);
            if (res.data?.mock) {
                setMock(res.data.txnRef);
                setPaying(false);
                return;
            }
            if (res.data?.paymentUrl) {
                window.location.assign(res.data.paymentUrl);
                return;
            }
            message.error(errorText(res, 'Chưa thể tạo đơn thanh toán. Vui lòng thử lại.'));
        } catch {
            message.error('Chưa thể tạo đơn thanh toán. Vui lòng thử lại.');
        }
        setPaying(false);
    };

    const finishMock = async (success: boolean) => {
        if (!mock) return;
        setPaying(true);
        try {
            const res = await callMockComplete(mock, success);
            const url = res.data?.returnUrl;
            if (!url) throw new Error();
            setMock(null);
            setPurchase(null);
            const answer = await callVnpayReturn(url.slice(url.indexOf('?')));
            setResult(answer.data ?? { error: errorText(answer, 'Không xác nhận được giao dịch.') });
            if (answer.data?.outcome === 'SUCCESS') load();
        } catch {
            message.error('Không hoàn tất được giao dịch giả lập.');
        }
        setPaying(false);
    };

    const product = (code: EmployerProductCode) => data?.products.find(item => item.code === code);
    const pinnedUntil = (jobId?: string) => data?.pins.find(pin => String(pin.jobId) === String(jobId))?.until;
    const slotsPack = product('JOB_SLOTS_5');
    const talent = product('TALENT_30');

    const jobColumns: ColumnsType<IJob> = [
        { title: 'Tin tuyển dụng', dataIndex: 'name' },
        {
            title: 'Ghim',
            width: 190,
            render: (_, job) => {
                const until = pinnedUntil(job.id);
                return until ? <Tag color="orange">Đang ghim đến {formatDate(until)}</Tag> : <span>Chưa ghim</span>;
            },
        },
        {
            title: '',
            width: 250,
            render: (_, job) => (
                <Space>
                    {(['JOB_PIN_7', 'JOB_PIN_30'] as const).map(code => {
                        const item = product(code);
                        return item ? (
                            <Button
                                key={code}
                                size="small"
                                icon={<PushpinOutlined />}
                                onClick={() => setPurchase({ product: item, job: { id: job.id!, name: job.name } })}
                            >
                                {item.days} ngày · {formatVnd(item.priceVnd)}
                            </Button>
                        ) : null;
                    })}
                </Space>
            ),
        },
    ];

    const orderColumns: ColumnsType<IOrder> = [
        { title: 'Ngày', dataIndex: 'createdAt', width: 110, render: (value: string) => formatDate(value) },
        { title: 'Dịch vụ', dataIndex: 'label' },
        { title: 'Số tiền', dataIndex: 'amount', width: 110, render: (value: number) => formatVnd(value) },
        {
            title: 'Hiệu lực đến',
            dataIndex: 'endsAt',
            width: 130,
            render: (value?: string | null) => (value ? formatDate(value) : ''),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 160,
            render: (value: IOrder['status']) => <Tag color={STATUS[value].color}>{STATUS[value].label}</Tag>,
        },
    ];

    if (failed) return <Alert type="error" showIcon message="Chưa tải được thông tin dịch vụ. Vui lòng thử lại sau." />;
    if (!data) return <Skeleton active paragraph={{ rows: 10 }} />;

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <h2 style={{ margin: 0 }}>Dịch vụ và thanh toán</h2>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <Card title="Chỗ đăng tin">
                    <Progress
                        percent={Math.min(100, Math.round((data.openJobs / data.jobLimit) * 100))}
                        format={() => `${data.openJobs} / ${data.jobLimit}`}
                        status={data.openJobs >= data.jobLimit ? 'exception' : 'normal'}
                    />
                    <p>
                        {data.freeJobs} chỗ miễn phí
                        {data.jobLimit > data.freeJobs
                            ? ` và ${data.jobLimit - data.freeJobs} chỗ từ gói đang chạy`
                            : ''}
                        . Tin đang bật và chưa hết hạn tính là đang mở.
                    </p>
                    {slotsPack && (
                        <Button type="primary" onClick={() => setPurchase({ product: slotsPack })}>
                            {slotsPack.label} · {formatVnd(slotsPack.priceVnd)} / {slotsPack.days} ngày
                        </Button>
                    )}
                </Card>
                <Card title="Kho ứng viên">
                    {data.talentUntil ? (
                        <Tag color="green">Đã mở khóa đến {formatDate(data.talentUntil)}</Tag>
                    ) : (
                        <Tag icon={<LockOutlined />}>Chưa mở khóa</Tag>
                    )}
                    <p style={{ marginTop: 12 }}>
                        Danh sách ứng viên luôn xem được. Mở khóa để xem chi tiết hồ sơ và CV của ứng viên đã chia sẻ hồ
                        sơ.
                    </p>
                    {talent && (
                        <Button type="primary" onClick={() => setPurchase({ product: talent })}>
                            {data.talentUntil ? 'Gia hạn' : talent.label} · {formatVnd(talent.priceVnd)} / {talent.days}{' '}
                            ngày
                        </Button>
                    )}
                </Card>
            </div>
            <Card title="Ghim tin lên đầu danh sách việc làm">
                <p>Tin được ghim nằm trên cùng danh sách việc làm kèm nhãn "Tin ghim" trong thời gian đã mua.</p>
                <Table
                    rowKey="id"
                    size="small"
                    columns={jobColumns}
                    dataSource={jobs}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                    locale={{ emptyText: 'Công ty chưa có tin đang bật để ghim.' }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
            <Card title="Lịch sử giao dịch">
                <Table
                    rowKey="id"
                    size="small"
                    columns={orderColumns}
                    dataSource={data.orders}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                    locale={{ emptyText: 'Chưa có giao dịch nào.' }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                open={purchase !== null && mock === null}
                onCancel={() => !paying && setPurchase(null)}
                footer={null}
                centered
                width={400}
                destroyOnClose
                title="Thanh toán"
            >
                {purchase && (
                    <>
                        <p>
                            <strong>{purchase.product.label}</strong>
                            {purchase.job ? ` cho tin "${purchase.job.name}"` : ''} · {purchase.product.days} ngày
                        </p>
                        <Radio.Group
                            value={method}
                            onChange={event => setMethod(event.target.value)}
                            style={{ display: 'grid', gap: 8, margin: '12px 0' }}
                        >
                            {PAYMENT_METHODS.map(item => {
                                const ok = available[item.code] ?? false;
                                return (
                                    <Radio key={item.code} value={item.code} disabled={!ok || paying}>
                                        <img
                                            src={item.logo}
                                            alt=""
                                            height={18}
                                            style={{ marginRight: 8, verticalAlign: 'middle' }}
                                        />
                                        {item.label}
                                        {!ok && (
                                            <small style={{ marginLeft: 8, color: '#6b635c' }}>Chưa khả dụng</small>
                                        )}
                                    </Radio>
                                );
                            })}
                        </Radio.Group>
                        <p>
                            Tổng cộng: <strong>{formatVnd(purchase.product.priceVnd)}</strong>
                        </p>
                        <Button type="primary" block loading={paying} disabled={!available[method]} onClick={proceed}>
                            Tiếp tục thanh toán
                        </Button>
                        <p style={{ marginTop: 12, color: '#6b635c', fontSize: 13 }}>
                            Thanh toán một lần, không tự động gia hạn.
                        </p>
                    </>
                )}
            </Modal>

            <Modal
                open={mock !== null}
                footer={null}
                centered
                width={380}
                closable={!paying}
                maskClosable={false}
                onCancel={() => setMock(null)}
                title={`${paymentLabel(method).toUpperCase()} SANDBOX`}
            >
                <p>Cổng thanh toán giả lập để thử nghiệm (backend đang bật PAYMENT_MOCK). Không có tiền nào bị trừ.</p>
                <Space>
                    <Button type="primary" loading={paying} onClick={() => finishMock(true)}>
                        Thanh toán thành công
                    </Button>
                    <Button disabled={paying} onClick={() => finishMock(false)}>
                        Hủy giao dịch
                    </Button>
                </Space>
            </Modal>

            <Modal
                open={result !== null || checking}
                footer={null}
                centered
                width={420}
                onCancel={() => setResult(null)}
                closable={!checking}
            >
                {checking && !result && (
                    <Result
                        status="info"
                        title="Đang xác nhận thanh toán"
                        subTitle="Vui lòng chờ kết quả từ cổng thanh toán."
                    />
                )}
                {result && 'error' in result && (
                    <Result status="warning" title="Chưa xác nhận được giao dịch" subTitle={result.error} />
                )}
                {result && 'outcome' in result && (
                    <Result
                        status={
                            result.outcome === 'SUCCESS' ? 'success' : result.outcome === 'PENDING' ? 'info' : 'error'
                        }
                        title={
                            result.outcome === 'SUCCESS' ? `${result.order.label} đã được kích hoạt` : result.message
                        }
                        subTitle={
                            result.outcome === 'SUCCESS' && result.order.endsAt
                                ? `Có hiệu lực đến ${formatDate(result.order.endsAt)}.`
                                : undefined
                        }
                        extra={
                            <Button type="primary" onClick={() => setResult(null)}>
                                Đóng
                            </Button>
                        }
                    />
                )}
            </Modal>
        </div>
    );
};

export default ServicePage;
