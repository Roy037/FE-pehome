import { useRef, useState } from 'react';
import { Button, Popconfirm, Space, Tag, message, notification } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { sfLike } from 'spring-filter-query-builder';
import DataTable from '@/components/client/data-table';
import Access from '@/components/share/access';
import ModalSubscriber from '@/components/admin/subscriber/modal.subscriber';
import { callDeleteSubscriber, callFetchSubscriber } from '@/config/api';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { errorMessage, escapeFilter } from '@/config/utils';
import { ISubscribers } from '@/types/backend';

const SORTABLE = ['name', 'email', 'createdAt', 'updatedAt'];

const SubscriberPage = () => {
    const tableRef = useRef<ActionType>();
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<ISubscribers | null>(null);

    const remove = async (id?: string) => {
        if (!id) return;
        const res = await callDeleteSubscriber(id);
        if (+res.statusCode === 200) {
            message.success('Đã xóa đăng ký nhận tin.');
            tableRef.current?.reload();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: errorMessage(res.message) });
        }
    };

    const columns: ProColumns<ISubscribers>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            hideInSearch: true,
            render: (_, __, index) => index + 1 + (meta.page - 1) * meta.pageSize,
        },
        { title: 'Họ và tên', dataIndex: 'name', sorter: true },
        { title: 'Email', dataIndex: 'email', sorter: true },
        {
            title: 'Kỹ năng quan tâm',
            dataIndex: 'skills',
            hideInSearch: true,
            render: (_, row) =>
                row.skills?.length
                    ? row.skills.map(skill => (
                          <Tag key={skill.id} color="orange">
                              {skill.name}
                          </Tag>
                      ))
                    : '—',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            width: 170,
            sorter: true,
            hideInSearch: true,
            render: (_, row) => (row.createdAt ? dayjs(row.createdAt).format('DD-MM-YYYY HH:mm') : ''),
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updatedAt',
            width: 170,
            sorter: true,
            hideInSearch: true,
            render: (_, row) => (row.updatedAt ? dayjs(row.updatedAt).format('DD-MM-YYYY HH:mm') : ''),
        },
        {
            title: 'Thao tác',
            width: 90,
            align: 'center',
            hideInSearch: true,
            render: (_, row) => (
                <Space size="middle">
                    <Access permission={ALL_PERMISSIONS.SUBSCRIBERS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: '#ffa500', cursor: 'pointer' }}
                            aria-label="Sửa đăng ký"
                            onClick={() => {
                                setDataInit(row);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.SUBSCRIBERS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xóa đăng ký này?"
                            description="Người này sẽ không còn nhận việc làm qua email."
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => remove(row.id)}
                        >
                            <DeleteOutlined
                                style={{ fontSize: 18, color: '#ff4d4f', cursor: 'pointer' }}
                                aria-label="Xóa đăng ký"
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <Access permission={ALL_PERMISSIONS.SUBSCRIBERS.GET_PAGINATE}>
            <DataTable<ISubscribers>
                actionRef={tableRef}
                headerTitle="Đăng ký nhận tin"
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
                    showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} đăng ký`,
                }}
                toolBarRender={(): any => [
                    <Access key="create" permission={ALL_PERMISSIONS.SUBSCRIBERS.CREATE} hideChildren>
                        <Button
                            icon={<PlusOutlined />}
                            type="primary"
                            onClick={() => {
                                setDataInit(null);
                                setOpenModal(true);
                            }}
                        >
                            Thêm mới
                        </Button>
                    </Access>,
                ]}
                request={async (params, sort) => {
                    const filters: string[] = [];
                    if (params.name) filters.push(sfLike('name', escapeFilter(String(params.name)), true).toString());
                    if (params.email)
                        filters.push(sfLike('email', escapeFilter(String(params.email)), true).toString());
                    const field = SORTABLE.find(key => sort?.[key]);
                    const query = new URLSearchParams({
                        page: String(params.current ?? 1),
                        size: String(params.pageSize ?? 10),
                        sort: field ? `${field},${sort[field] === 'ascend' ? 'asc' : 'desc'}` : 'createdAt,desc',
                    });
                    if (filters.length) query.set('filter', filters.join(' and '));
                    const res = await callFetchSubscriber(query.toString());
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
            <ModalSubscriber
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={() => tableRef.current?.reload()}
            />
        </Access>
    );
};

export default SubscriberPage;
