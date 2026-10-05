import { useRef, useState } from 'react';
import { Button, Popconfirm, message, notification } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { sfLike } from 'spring-filter-query-builder';
import DataTable from '@/components/client/data-table';
import Access from '@/components/share/access';
import ModalSavedJob from '@/components/admin/saved-job/modal.saved-job';
import { callDeleteSavedJob, callFetchAllSavedJobs } from '@/config/api';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { errorMessage, escapeFilter } from '@/config/utils';
import { ISavedJob } from '@/types/backend';

type Row = ISavedJob & { userName?: string; jobName?: string; companyName?: string };

const SavedJobPage = () => {
    const tableRef = useRef<ActionType>();
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
    const [openModal, setOpenModal] = useState(false);

    const remove = async (id: number) => {
        const res = await callDeleteSavedJob(id);
        if (+res.statusCode === 200) {
            message.success('Đã xóa việc làm đã lưu.');
            tableRef.current?.reload();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: errorMessage(res.message) });
        }
    };

    const columns: ProColumns<Row>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            hideInSearch: true,
            render: (_, __, index) => index + 1 + (meta.page - 1) * meta.pageSize,
        },
        {
            title: 'Người dùng',
            dataIndex: 'userName',
            render: (_, row) => (
                <>
                    <strong>{row.user.name}</strong>
                    <br />
                    <small style={{ color: 'var(--muted)' }}>{row.user.email}</small>
                </>
            ),
        },
        { title: 'Việc làm', dataIndex: 'jobName', render: (_, row) => row.job.name },
        { title: 'Công ty', dataIndex: 'companyName', render: (_, row) => row.job.companyName || '—' },
        {
            title: 'Ngày lưu',
            dataIndex: 'createdAt',
            width: 170,
            sorter: true,
            hideInSearch: true,
            render: (_, row) => dayjs(row.createdAt).format('DD-MM-YYYY HH:mm'),
        },
        {
            title: 'Thao tác',
            width: 80,
            align: 'center',
            hideInSearch: true,
            render: (_, row) => (
                <Access permission={ALL_PERMISSIONS.SAVED_JOBS.DELETE} hideChildren>
                    <Popconfirm
                        placement="leftTop"
                        title="Xóa việc làm đã lưu?"
                        description="Việc làm sẽ biến mất khỏi danh sách đã lưu của người dùng."
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => remove(row.id)}
                    >
                        <DeleteOutlined
                            style={{ fontSize: 18, color: '#ff4d4f', cursor: 'pointer' }}
                            aria-label="Xóa việc làm đã lưu"
                        />
                    </Popconfirm>
                </Access>
            ),
        },
    ];

    return (
        <Access permission={ALL_PERMISSIONS.SAVED_JOBS.GET_PAGINATE}>
            <DataTable<Row>
                actionRef={tableRef}
                headerTitle="Việc làm đã lưu"
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
                toolBarRender={(): any => [
                    <Access key="create" permission={ALL_PERMISSIONS.SAVED_JOBS.CREATE} hideChildren>
                        <Button icon={<PlusOutlined />} type="primary" onClick={() => setOpenModal(true)}>
                            Thêm mới
                        </Button>
                    </Access>,
                ]}
                request={async (params, sort) => {
                    const filters: string[] = [];
                    if (params.userName)
                        filters.push(sfLike('user.name', escapeFilter(String(params.userName)), true).toString());
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
                    const res = await callFetchAllSavedJobs(query.toString());
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
            <ModalSavedJob
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={() => tableRef.current?.reload()}
            />
        </Access>
    );
};

export default SavedJobPage;
