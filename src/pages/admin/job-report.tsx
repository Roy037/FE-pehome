import { useRef, useState } from 'react';
import { Input, Modal, Popconfirm, Space, Tag, Tooltip, message, notification } from 'antd';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { sfLike } from 'spring-filter-query-builder';
import DataTable from '@/components/client/data-table';
import Access from '@/components/share/access';
import { callDeleteJobReport, callFetchJobReports, callLockJob, callUnlockJob } from '@/config/api';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { JOB_REPORT_REASONS, errorMessage, escapeFilter, labelOf } from '@/config/utils';
import { IJobReport } from '@/types/backend';

// Moderation queue: reports from candidates, with lock / unlock for the post and dismiss for the report.
const JobReportPage = () => {
    const tableRef = useRef<ActionType>();
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
    const [locking, setLocking] = useState<IJobReport | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const done = (res: { statusCode: number | string; message?: string | string[] }, success: string) => {
        if (+res.statusCode === 200) {
            message.success(success);
            tableRef.current?.reload();
            return true;
        }
        notification.error({ message: 'Có lỗi xảy ra', description: errorMessage(res.message) });
        return false;
    };

    const openLock = (row: IJobReport) => {
        setReason(
            `Báo cáo: ${labelOf(JOB_REPORT_REASONS, row.reason)}${row.detail ? ` – ${row.detail}` : ''}`.slice(0, 500),
        );
        setLocking(row);
    };
    const confirmLock = async () => {
        if (!locking) return;
        setBusy(true);
        const ok = done(await callLockJob(locking.job.id, reason), 'Đã khóa tin tuyển dụng.');
        setBusy(false);
        if (ok) setLocking(null);
    };

    const columns: ProColumns<IJobReport>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            hideInSearch: true,
            render: (_, __, index) => index + 1 + (meta.page - 1) * meta.pageSize,
        },
        {
            title: 'Việc làm',
            dataIndex: 'jobName',
            render: (_, row) => (
                <span>
                    <strong>{row.job.name}</strong>
                    {row.job.locked && (
                        <Tooltip title={row.job.lockReason}>
                            <Tag color="red" style={{ marginLeft: 8 }}>
                                Đã khóa
                            </Tag>
                        </Tooltip>
                    )}
                    <br />
                    <small style={{ color: 'var(--muted)' }}>{row.job.companyName || '—'}</small>
                </span>
            ),
        },
        { title: 'Công ty', dataIndex: 'companyName', hidden: true },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            hideInSearch: true,
            width: 190,
            render: (_, row) => (
                <Tag color={row.reason === 'SCAM' ? 'red' : 'orange'}>{labelOf(JOB_REPORT_REASONS, row.reason)}</Tag>
            ),
        },
        {
            title: 'Chi tiết',
            dataIndex: 'detail',
            hideInSearch: true,
            ellipsis: true,
            render: (_, row) => row.detail || '—',
        },
        {
            title: 'Người báo cáo',
            dataIndex: 'reporter',
            hideInSearch: true,
            render: (_, row) => (
                <span>
                    {row.user.name}
                    <br />
                    <small style={{ color: 'var(--muted)' }}>{row.user.email}</small>
                </span>
            ),
        },
        {
            title: 'Ngày',
            dataIndex: 'createdAt',
            width: 150,
            sorter: true,
            hideInSearch: true,
            render: (_, row) => dayjs(row.createdAt).format('DD-MM-YYYY HH:mm'),
        },
        {
            title: 'Thao tác',
            width: 190,
            hideInSearch: true,
            render: (_, row) => (
                <Space size="middle">
                    {row.job.locked ? (
                        <Access permission={ALL_PERMISSIONS.JOBS.UNLOCK} hideChildren>
                            <Popconfirm
                                title="Mở khóa tin này?"
                                description="Tin sẽ hiển thị công khai và nhận hồ sơ trở lại."
                                okText="Mở khóa"
                                cancelText="Hủy"
                                onConfirm={async () => done(await callUnlockJob(row.job.id), 'Đã mở khóa tin.')}
                            >
                                <a>Mở khóa</a>
                            </Popconfirm>
                        </Access>
                    ) : (
                        <Access permission={ALL_PERMISSIONS.JOBS.LOCK} hideChildren>
                            <a onClick={() => openLock(row)}>Khóa tin</a>
                        </Access>
                    )}
                    <Access permission={ALL_PERMISSIONS.JOB_REPORTS.DELETE} hideChildren>
                        <Popconfirm
                            title="Bỏ qua báo cáo này?"
                            description="Báo cáo sẽ bị xóa; người báo cáo có thể gửi lại."
                            okText="Bỏ qua"
                            cancelText="Hủy"
                            onConfirm={async () => done(await callDeleteJobReport(row.id), 'Đã bỏ qua báo cáo.')}
                        >
                            <a style={{ color: '#ff4d4f' }}>Bỏ qua</a>
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <Access permission={ALL_PERMISSIONS.JOB_REPORTS.GET_PAGINATE}>
            <DataTable<IJobReport>
                actionRef={tableRef}
                headerTitle="Báo cáo tin tuyển dụng"
                rowKey="id"
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
                    if (params.jobName)
                        filters.push(sfLike('job.name', escapeFilter(String(params.jobName)), true).toString());
                    if (params.companyName)
                        filters.push(
                            sfLike('job.company.name', escapeFilter(String(params.companyName)), true).toString(),
                        );
                    const query = new URLSearchParams({
                        page: String(params.current ?? 1),
                        size: String(params.pageSize ?? 10),
                        sort: sort?.createdAt === 'ascend' ? 'createdAt,asc' : 'createdAt,desc',
                    });
                    if (filters.length) query.set('filter', filters.join(' and '));
                    const res = await callFetchJobReports(query.toString());
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
            <Modal
                title="Khóa tin tuyển dụng"
                open={locking !== null}
                onCancel={() => setLocking(null)}
                onOk={confirmLock}
                okText="Khóa tin"
                cancelText="Hủy"
                okButtonProps={{ danger: true, disabled: !reason.trim(), loading: busy }}
                destroyOnClose
                centered
            >
                <p style={{ marginBottom: 12 }}>
                    Tin <strong>{locking?.job.name}</strong> sẽ bị ẩn khỏi trang công khai, không nhận hồ sơ mới và
                    không nằm trong email thông báo. Nhà tuyển dụng vẫn thấy tin kèm lý do.
                </p>
                <Input.TextArea
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    maxLength={500}
                    showCount
                    rows={3}
                    placeholder="Lý do khóa (nhà tuyển dụng sẽ thấy)"
                />
            </Modal>
        </Access>
    );
};

export default JobReportPage;
