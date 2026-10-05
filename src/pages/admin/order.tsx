import { useRef, useState } from 'react';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import { sfEqual, sfLike } from 'spring-filter-query-builder';
import DataTable from '@/components/client/data-table';
import Access from '@/components/share/access';
import { callFetchOrders } from '@/config/api';
import { paymentLabel, PAYMENT_METHODS } from '@/config/payment-methods';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { escapeFilter, formatVnd, ORDER_STATUS } from '@/config/utils';
import { IAdminOrder } from '@/types/backend';

const PLAN_NAME: Record<string, string> = {
    BASIC: 'Basic',
    STANDARD: 'Standard',
    PREMIUM: 'Premium',
    JOB_PIN_7: 'Ghim tin 7 ngày',
    JOB_PIN_30: 'Ghim tin 30 ngày',
    JOB_SLOTS_5: 'Thêm 5 tin đang mở',
    TALENT_30: 'Mở khóa kho ứng viên',
};
const day = (value?: string | null) => (value ? dayjs(value).format('DD-MM-YYYY') : '—');

const OrderPage = () => {
    const tableRef = useRef<ActionType>();
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });

    const columns: ProColumns<IAdminOrder>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            hideInSearch: true,
            render: (_, __, index) => index + 1 + (meta.page - 1) * meta.pageSize,
        },
        {
            title: 'Mã giao dịch',
            dataIndex: 'txnRef',
            render: (_, row) => (
                <>
                    <strong>{row.txnRef}</strong>
                    {row.gatewayTxnNo && (
                        <>
                            <br />
                            <small style={{ color: 'var(--muted)' }}>Cổng: {row.gatewayTxnNo}</small>
                        </>
                    )}
                </>
            ),
        },
        {
            title: 'Người mua',
            dataIndex: 'userEmail',
            render: (_, row) => (
                <>
                    <strong>{row.userName}</strong>
                    <br />
                    <small style={{ color: 'var(--muted)' }}>{row.userEmail}</small>
                </>
            ),
        },
        {
            title: 'Gói',
            dataIndex: 'plan',
            width: 110,
            valueType: 'select',
            valueEnum: Object.fromEntries(Object.entries(PLAN_NAME).map(([code, name]) => [code, { text: name }])),
            render: (_, row) => row.order.label,
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            width: 120,
            align: 'right',
            hideInSearch: true,
            render: (_, row) => formatVnd(row.order.amount),
        },
        {
            title: 'Phương thức',
            dataIndex: 'method',
            width: 130,
            valueType: 'select',
            valueEnum: Object.fromEntries(PAYMENT_METHODS.map(item => [item.code, { text: item.label }])),
            render: (_, row) => (row.order.method ? paymentLabel(row.order.method) : '—'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 150,
            valueType: 'select',
            valueEnum: Object.fromEntries(
                Object.entries(ORDER_STATUS).map(([code, item]) => [code, { text: item.label }]),
            ),
            render: (_, row) => (
                <Tag color={ORDER_STATUS[row.order.status]?.color} style={{ margin: 0 }}>
                    {ORDER_STATUS[row.order.status]?.label ?? row.order.status}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            width: 150,
            sorter: true,
            hideInSearch: true,
            render: (_, row) => dayjs(row.order.createdAt).format('DD-MM-YYYY HH:mm'),
        },
        {
            title: 'Hiệu lực',
            dataIndex: 'period',
            width: 190,
            hideInSearch: true,
            render: (_, row) => (row.order.startsAt ? `${day(row.order.startsAt)} → ${day(row.order.endsAt)}` : '—'),
        },
    ];

    return (
        <Access permission={ALL_PERMISSIONS.ORDERS.GET_PAGINATE}>
            <DataTable<IAdminOrder>
                actionRef={tableRef}
                headerTitle="Giao dịch Premium"
                rowKey={row => row.order.id}
                columns={columns}
                scroll={{ x: true }}
                rowSelection={false}
                search={{ labelWidth: 'auto' }}
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} bản ghi`,
                }}
                request={async (params, sort) => {
                    const filters: string[] = [];
                    if (params.txnRef)
                        filters.push(sfLike('txnRef', escapeFilter(String(params.txnRef)), true).toString());
                    if (params.userEmail)
                        filters.push(sfLike('user.email', escapeFilter(String(params.userEmail)), true).toString());
                    for (const key of ['plan', 'method', 'status'] as const) {
                        if (!params[key]) continue;
                        const value = String(params[key]);
                        // the same column filters candidate plans and employer products, which are separate fields
                        filters.push(
                            sfEqual(
                                key === 'plan' && /^(JOB_|TALENT_)/.test(value) ? 'product' : key,
                                value,
                            ).toString(),
                        );
                    }
                    const query = new URLSearchParams({
                        page: String(params.current ?? 1),
                        size: String(params.pageSize ?? 10),
                        sort: sort?.createdAt === 'ascend' ? 'createdAt,asc' : 'createdAt,desc',
                    });
                    if (filters.length) query.set('filter', filters.join(' and '));
                    const res = await callFetchOrders(query.toString());
                    if (res.data)
                        setMeta({
                            page: res.data.meta.page,
                            pageSize: res.data.meta.pageSize,
                            total: res.data.meta.total,
                        });
                    return {
                        data: res.data?.result ?? [],
                        success: Boolean(res.data),
                        total: res.data?.meta.total ?? 0,
                    };
                }}
            />
        </Access>
    );
};

export default OrderPage;
