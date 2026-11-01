import { useRef, useState } from 'react';
import { Button, Popconfirm, Rate, Space, message, notification } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { sfLike } from 'spring-filter-query-builder';
import DataTable from '@/components/client/data-table';
import Access from '@/components/share/access';
import { callDeleteReview, callFetchReviews } from '@/config/api';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { escapeFilter } from '@/config/utils';
import { IReview } from '@/types/backend';
import ModalReview from '@/components/admin/review/modal.review';

type ReviewRow = IReview & { companyName?: string; userName?: string };

const ReviewPage = () => {
    const tableRef = useRef<ActionType>();
    const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0 });
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IReview | null>(null);

    const remove = async (id: number) => {
        const res = await callDeleteReview(id);
        if (+res.statusCode === 200) {
            message.success('Đã xóa đánh giá.');
            tableRef.current?.reload();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: res.message });
        }
    };

    const columns: ProColumns<ReviewRow>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            hideInSearch: true,
            render: (_, __, index) => index + 1 + (meta.page - 1) * meta.pageSize,
        },
        { title: 'Công ty', dataIndex: 'companyName', render: (_, row) => row.company.name },
        { title: 'Người đánh giá', dataIndex: 'userName', render: (_, row) => row.user.name },
        {
            title: 'Số sao',
            dataIndex: 'rating',
            width: 170,
            valueType: 'select',
            valueEnum: {
                5: { text: '5 sao' },
                4: { text: '4 sao' },
                3: { text: '3 sao' },
                2: { text: '2 sao' },
                1: { text: '1 sao' },
            },
            render: (_, row) => <Rate disabled value={row.rating} style={{ fontSize: 14 }} />,
        },
        { title: 'Nội dung', dataIndex: 'content', ellipsis: true, hideInSearch: true },
        {
            title: 'Cập nhật',
            dataIndex: 'updatedAt',
            width: 170,
            sorter: true,
            hideInSearch: true,
            render: (_, row) => dayjs(row.updatedAt).format('DD-MM-YYYY HH:mm'),
        },
        {
            title: 'Thao tác',
            width: 90,
            align: 'center',
            hideInSearch: true,
            render: (_, row) => (
                <Space size="middle">
                    <Access permission={ALL_PERMISSIONS.REVIEWS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: '#ffa500', cursor: 'pointer' }}
                            aria-label="Sửa đánh giá"
                            onClick={() => {
                                setDataInit(row);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.REVIEWS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xóa đánh giá này?"
                            description="Đánh giá sẽ bị xóa vĩnh viễn."
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => remove(row.id)}
                        >
                            <DeleteOutlined
                                style={{ fontSize: 18, color: '#ff4d4f', cursor: 'pointer' }}
                                aria-label="Xóa đánh giá"
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <Access permission={ALL_PERMISSIONS.REVIEWS.GET_PAGINATE}>
            <DataTable<ReviewRow>
                actionRef={tableRef}
                headerTitle="Đánh giá công ty"
                rowKey="id"
                columns={columns}
                scroll={{ x: true }}
                rowSelection={false}
                search={{ labelWidth: 'auto' }}
                toolBarRender={(): any => [
                    <Access key="create" permission={ALL_PERMISSIONS.REVIEWS.CREATE} hideChildren>
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
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} đánh giá`,
                }}
                request={async (params, sort) => {
                    const filters: string[] = [];
                    if (params.companyName)
                        filters.push(sfLike('company.name', escapeFilter(String(params.companyName)), true).toString());
                    if (params.userName)
                        filters.push(sfLike('user.name', escapeFilter(String(params.userName)), true).toString());
                    if (params.rating) filters.push(`rating : ${Number(params.rating)}`);
                    const query = new URLSearchParams({
                        page: String(params.current ?? 1),
                        size: String(params.pageSize ?? 10),
                        sort: sort?.updatedAt === 'ascend' ? 'updatedAt,asc' : 'updatedAt,desc',
                    });
                    if (filters.length) query.set('filter', filters.join(' and '));
                    const res = await callFetchReviews(query.toString());
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
            <ModalReview
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={() => tableRef.current?.reload()}
            />
        </Access>
    );
};

export default ReviewPage;
