import { useEffect, useState } from 'react';
import { Progress, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { callFetchMyOrders, callFetchMyPlan } from '@/config/api';
import { ORDER_STATUS as STATUS, formatDate, formatVnd } from '@/config/utils';
import { IMyPlan, IOrder } from '@/types/backend';
import { useUpgradeModal } from './modal/upgrade.modal';
import p from '@/styles/plans.module.scss';
import ui from '@/styles/client.module.scss';

const columns: ColumnsType<IOrder> = [
    { title: 'Ngày', dataIndex: 'createdAt', render: (value: string) => formatDate(value) },
    { title: 'Gói', dataIndex: 'label' },
    { title: 'Số tiền', dataIndex: 'amount', render: (value: number) => formatVnd(value) },
    {
        title: 'Hiệu lực đến',
        dataIndex: 'endsAt',
        render: (value?: string | null) => (value ? formatDate(value) : '—'),
    },
    {
        title: 'Trạng thái',
        dataIndex: 'status',
        render: (value: IOrder['status']) => <Tag color={STATUS[value].color}>{STATUS[value].label}</Tag>,
    },
];

const usage = (used: number, cap: number, big: number) => (cap >= big ? 'Không giới hạn' : `${used} / ${cap}`);

const MyPlan = () => {
    const openUpgrade = useUpgradeModal();
    const [plan, setPlan] = useState<IMyPlan | null>(null);
    const [orders, setOrders] = useState<IOrder[] | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [planRes, orderRes] = await Promise.all([callFetchMyPlan(), callFetchMyOrders()]);
                setPlan(planRes.data ?? null);
                setOrders(orderRes.data ?? []);
            } catch {
                setOrders([]);
                message.error('Chưa thể tải thông tin gói của bạn.');
            }
        })();
    }, []);

    if (!plan || orders === null) return <div className={ui.modalLoading}>Đang tải thông tin gói…</div>;
    return (
        <div>
            <div className={p.mySummary}>
                <div>
                    <span>Gói hiện tại</span>
                    <strong>{plan.name}</strong>
                    <small>
                        {plan.expiresAt
                            ? `Có hiệu lực đến ${formatDate(plan.expiresAt)}`
                            : 'Nâng cấp để theo dõi nhiều kỹ năng và lưu nhiều việc làm hơn.'}
                    </small>
                </div>
                <button type="button" className={ui.btnPrimarySm} onClick={openUpgrade}>
                    {plan.plan ? 'Gia hạn / nâng cấp' : 'Nâng cấp Premium'}
                </button>
            </div>
            <div className={p.myUsage}>
                <div>
                    <p>
                        <span>Kỹ năng nhận việc qua email</span>
                        <strong>{usage(plan.alertSkillsUsed, plan.alertSkillCap, 100)}</strong>
                    </p>
                    <Progress
                        percent={Math.min(
                            100,
                            Math.round((plan.alertSkillsUsed * 100) / Math.max(1, plan.alertSkillCap)),
                        )}
                        showInfo={false}
                        strokeColor="#E3763C"
                    />
                </div>
                <div>
                    <p>
                        <span>Việc làm đã lưu</span>
                        <strong>{usage(plan.savedJobsUsed, plan.savedJobCap, 1000)}</strong>
                    </p>
                    <Progress
                        percent={Math.min(100, Math.round((plan.savedJobsUsed * 100) / Math.max(1, plan.savedJobCap)))}
                        showInfo={false}
                        strokeColor="#E3763C"
                    />
                </div>
            </div>
            <h3 className={p.myTitle}>Lịch sử thanh toán</h3>
            <Table<IOrder>
                rowKey="id"
                columns={columns}
                dataSource={orders}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: 'Bạn chưa có giao dịch nào.' }}
            />
        </div>
    );
};

export default MyPlan;
