import DataTable from '@/components/client/data-table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUser } from '@/redux/slice/userSlide';
import { IUser } from '@/types/backend';
import { DeleteOutlined, EditOutlined, LockOutlined, PlusOutlined, UnlockOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, message, notification } from 'antd';
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { callDeleteUser, callLockUser } from '@/config/api';
import queryString from 'query-string';
import ModalUser from '@/components/admin/user/modal.user';
import ViewDetailUser from '@/components/admin/user/view.user';
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { sfLike } from 'spring-filter-query-builder';

const UserPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<IUser | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.user.isFetching);
    const meta = useAppSelector(state => state.user.meta);
    const users = useAppSelector(state => state.user.result);
    const dispatch = useAppDispatch();

    const handleDeleteUser = async (id: string | undefined) => {
        if (id) {
            const res = await callDeleteUser(id);
            if (+res.statusCode === 200) {
                message.success('Xóa người dùng thành công');
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        }
    };

    const handleLockUser = async (id: string | undefined, locked: boolean) => {
        if (!id) return;
        const res = await callLockUser(id, locked);
        if (+res.statusCode === 200) {
            message.success(locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
            reloadTable();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: res.message });
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<IUser>[] = [
        {
            title: 'STT',
            key: 'index',
            width: 50,
            align: 'center',
            render: (text, record, index) => {
                return <>{index + 1 + (meta.page - 1) * meta.pageSize}</>;
            },
            hideInSearch: true,
        },
        {
            title: 'Họ tên',
            dataIndex: 'name',
            sorter: true,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            sorter: true,
        },

        {
            title: 'Tuổi',
            dataIndex: 'age',
            width: 70,
            align: 'center',
            hideInSearch: true,
            render: (_, entity) => entity.age || '—',
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            width: 100,
            hideInSearch: true,
            render: (_, entity) =>
                (({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }) as Record<string, string>)[entity.gender] ?? '—',
        },

        {
            title: 'Vai trò',
            dataIndex: ['role', 'name'],
            sorter: true,
            hideInSearch: true,
        },

        {
            title: 'Công ty',
            dataIndex: ['company', 'name'],
            sorter: true,
            hideInSearch: true,
        },

        {
            title: 'Trạng thái',
            dataIndex: 'locked',
            width: 110,
            hideInSearch: true,
            render: (_value, entity) =>
                entity.locked ? <Tag color="red">Đã khóa</Tag> : <Tag color="green">Hoạt động</Tag>,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            width: 200,
            sorter: true,
            render: (text, record) => {
                return <>{record.createdAt ? dayjs(record.createdAt).format('DD-MM-YYYY HH:mm:ss') : ''}</>;
            },
            hideInSearch: true,
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updatedAt',
            width: 200,
            sorter: true,
            render: (text, record) => {
                return <>{record.updatedAt ? dayjs(record.updatedAt).format('DD-MM-YYYY HH:mm:ss') : ''}</>;
            },
            hideInSearch: true,
        },
        {
            title: 'Thao tác',
            hideInSearch: true,
            width: 110,
            render: (_value, entity, _index, _action) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.USERS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{
                                fontSize: 20,
                                color: '#ffa500',
                            }}
                            type=""
                            onClick={() => {
                                setOpenModal(true);
                                setDataInit(entity);
                            }}
                        />
                    </Access>

                    {entity.role?.name !== 'SUPER_ADMIN' && (
                        <Access
                            permission={entity.locked ? ALL_PERMISSIONS.USERS.UNLOCK : ALL_PERMISSIONS.USERS.LOCK}
                            hideChildren
                        >
                            <Popconfirm
                                placement="leftTop"
                                title={entity.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                description={
                                    entity.locked
                                        ? 'Người dùng sẽ đăng nhập lại được.'
                                        : 'Người dùng sẽ bị đăng xuất và không đăng nhập được nữa.'
                                }
                                onConfirm={() => handleLockUser(entity.id, !entity.locked)}
                                okText="Xác nhận"
                                cancelText="Hủy"
                            >
                                <span
                                    style={{ cursor: 'pointer', margin: '0 10px' }}
                                    title={entity.locked ? 'Mở khóa' : 'Khóa'}
                                >
                                    {entity.locked ? (
                                        <UnlockOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                                    ) : (
                                        <LockOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
                                    )}
                                </span>
                            </Popconfirm>
                        </Access>
                    )}

                    <Access permission={ALL_PERMISSIONS.USERS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title={'Xóa người dùng'}
                            description={'Bạn có chắc chắn muốn xóa user này ?'}
                            onConfirm={() => handleDeleteUser(entity.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <span style={{ cursor: 'pointer', margin: '0 10px' }}>
                                <DeleteOutlined
                                    style={{
                                        fontSize: 20,
                                        color: '#ff4d4f',
                                    }}
                                />
                            </span>
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    const buildQuery = (params: any, sort: any, _filter: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize,
            filter: '',
        };

        const clone = { ...params };
        if (clone.name) q.filter = `${sfLike('name', clone.name)}`;
        if (clone.email) {
            q.filter = clone.name
                ? q.filter + ' and ' + `${sfLike('email', clone.email)}`
                : `${sfLike('email', clone.email)}`;
        }

        if (!q.filter) delete q.filter;
        let temp = queryString.stringify(q);

        let sortBy = '';
        if (sort && sort.name) {
            sortBy = sort.name === 'ascend' ? 'sort=name,asc' : 'sort=name,desc';
        }
        if (sort && sort.email) {
            sortBy = sort.email === 'ascend' ? 'sort=email,asc' : 'sort=email,desc';
        }
        if (sort && sort.createdAt) {
            sortBy = sort.createdAt === 'ascend' ? 'sort=createdAt,asc' : 'sort=createdAt,desc';
        }
        if (sort && sort.updatedAt) {
            sortBy = sort.updatedAt === 'ascend' ? 'sort=updatedAt,asc' : 'sort=updatedAt,desc';
        }

        //mặc định sort theo updatedAt
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=updatedAt,desc`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
    };

    return (
        <div>
            <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
                <DataTable<IUser>
                    actionRef={tableRef}
                    headerTitle="Danh sách Người dùng"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={users}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        dispatch(fetchUser({ query }));
                    }}
                    scroll={{ x: true }}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => {
                            return (
                                <div>
                                    {' '}
                                    {range[0]}-{range[1]} trên {total} mục
                                </div>
                            );
                        },
                    }}
                    rowSelection={false}
                    toolBarRender={(_action, _rows): any => {
                        return (
                            <Button icon={<PlusOutlined />} type="primary" onClick={() => setOpenModal(true)}>
                                Thêm mới
                            </Button>
                        );
                    }}
                />
            </Access>
            <ModalUser
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
            <ViewDetailUser
                onClose={setOpenViewDetail}
                open={openViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </div>
    );
};

export default UserPage;
