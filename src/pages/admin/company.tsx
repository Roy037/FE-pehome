import ModalCompany from '@/components/admin/company/modal.company';
import CompanyReviewDrawer from '@/components/admin/company/review.drawer';
import DataTable from '@/components/client/data-table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCompany } from '@/redux/slice/companySlide';
import { ICompany } from '@/types/backend';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Input, Modal, Popconfirm, Space, Tag, message, notification } from 'antd';
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { callDeleteCompany, callRejectCompany } from '@/config/api';
import { COMPANY_STATUS, companyStatus } from '@/config/utils';
import queryString from 'query-string';
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { sfLike } from 'spring-filter-query-builder';

const CompanyPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<ICompany | null>(null);

    const [reviewing, setReviewing] = useState<ICompany | null>(null);
    const [rejecting, setRejecting] = useState<ICompany | null>(null);
    const [reason, setReason] = useState('');
    const [rejectBusy, setRejectBusy] = useState(false);

    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.company.isFetching);
    const meta = useAppSelector(state => state.company.meta);
    const companies = useAppSelector(state => state.company.result);
    const dispatch = useAppDispatch();
    const myCompany = useAppSelector(state => state.account.user.company);

    const handleDeleteCompany = async (id: string | undefined) => {
        if (id) {
            const res = await callDeleteCompany(id);
            if (res && +res.statusCode === 200) {
                message.success('Xóa công ty thành công');
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        }
    };

    const handleReject = async () => {
        if (!rejecting?.id || !reason.trim()) return;
        setRejectBusy(true);
        const res = await callRejectCompany(rejecting.id, reason.trim());
        setRejectBusy(false);
        if (res && res.data) {
            message.success('Đã từ chối công ty');
            setRejecting(null);
            setReason('');
            reloadTable();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: res.message });
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<ICompany>[] = [
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
            title: 'Tên',
            dataIndex: 'name',
            sorter: true,
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            sorter: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'approved',
            width: 120,
            valueType: 'select',
            valueEnum: {
                APPROVED: { text: COMPANY_STATUS.APPROVED.label },
                PENDING: { text: COMPANY_STATUS.PENDING.label },
                REJECTED: { text: COMPANY_STATUS.REJECTED.label },
            },
            render: (_dom, entity) => {
                const status = companyStatus(entity);
                return (
                    <Tag color={COMPANY_STATUS[status].color} title={entity.rejectionReason ?? undefined}>
                        {COMPANY_STATUS[status].label}
                    </Tag>
                );
            },
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
            width: 50,
            render: (_value, entity, _index, _action) => (
                <Space>
                    {companyStatus(entity) === 'PENDING' && (
                        <Access permission={ALL_PERMISSIONS.COMPANIES.REJECT} hideChildren>
                            <CloseCircleOutlined
                                aria-label="Từ chối công ty"
                                title="Từ chối"
                                style={{ fontSize: 20, color: '#fa541c', cursor: 'pointer' }}
                                onClick={() => {
                                    setReason('');
                                    setRejecting(entity);
                                }}
                            />
                        </Access>
                    )}
                    {entity.approved === false && (
                        <Access permission={ALL_PERMISSIONS.COMPANIES.APPROVE} hideChildren>
                            <CheckCircleOutlined
                                aria-label="Xét duyệt công ty"
                                title="Xét duyệt"
                                style={{ fontSize: 20, color: '#52c41a', cursor: 'pointer' }}
                                onClick={() => setReviewing(entity)}
                            />
                        </Access>
                    )}
                    <Access permission={ALL_PERMISSIONS.COMPANIES.UPDATE} hideChildren>
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
                    <Access permission={ALL_PERMISSIONS.COMPANIES.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title={'Xóa công ty'}
                            description={'Bạn có chắc chắn muốn xóa company này ?'}
                            onConfirm={() => handleDeleteCompany(entity.id)}
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
        const clone = { ...params };
        const parts: string[] = [];
        if (myCompany) parts.push(`id : ${myCompany.id}`);
        if (clone.name) parts.push(`${sfLike('name', clone.name)}`);
        if (clone.address) parts.push(`${sfLike('address', clone.address)}`);
        if (clone.approved === 'APPROVED') parts.push('approved : true');
        if (clone.approved === 'PENDING') parts.push('approved : false and rejectionReason is null');
        if (clone.approved === 'REJECTED') parts.push('approved : false and rejectionReason is not null');
        const q: any = {
            page: params.current,
            size: params.pageSize,
        };
        if (parts.length) q.filter = parts.join(' and ');

        let temp = queryString.stringify(q);

        let sortBy = '';
        if (sort && sort.name) {
            sortBy = sort.name === 'ascend' ? 'sort=name,asc' : 'sort=name,desc';
        }
        if (sort && sort.address) {
            sortBy = sort.address === 'ascend' ? 'sort=address,asc' : 'sort=address,desc';
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
            <Access permission={ALL_PERMISSIONS.COMPANIES.GET_PAGINATE}>
                <DataTable<ICompany>
                    actionRef={tableRef}
                    headerTitle="Danh sách Công ty"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={companies}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        dispatch(fetchCompany({ query }));
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
                            <Access permission={ALL_PERMISSIONS.COMPANIES.CREATE} hideChildren>
                                <Button icon={<PlusOutlined />} type="primary" onClick={() => setOpenModal(true)}>
                                    Thêm mới
                                </Button>
                            </Access>
                        );
                    }}
                />
            </Access>
            <ModalCompany
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
            <CompanyReviewDrawer
                company={reviewing}
                onClose={() => setReviewing(null)}
                onApproved={reloadTable}
                onReject={company => {
                    setReason('');
                    setRejecting(company);
                }}
            />
            <Modal
                open={Boolean(rejecting)}
                title={`Từ chối công ty${rejecting ? ` “${rejecting.name}”` : ''}`}
                okText="Từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true, disabled: !reason.trim(), loading: rejectBusy }}
                onOk={handleReject}
                onCancel={() => setRejecting(null)}
                destroyOnClose
            >
                <p style={{ marginBottom: 8 }}>
                    Nhà tuyển dụng sẽ thấy lý do này. Họ chỉnh sửa thông tin công ty rồi lưu để gửi duyệt lại.
                </p>
                <Input.TextArea
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                    maxLength={500}
                    showCount
                    rows={4}
                    placeholder="Ví dụ: Chưa có giấy phép kinh doanh, thông tin công ty chưa rõ ràng..."
                    aria-label="Lý do từ chối"
                    autoFocus
                />
            </Modal>
        </div>
    );
};

export default CompanyPage;
