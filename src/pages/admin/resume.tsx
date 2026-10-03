import DataTable from '@/components/client/data-table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IResume } from '@/types/backend';
import { ActionType, ProColumns, ProFormSelect } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tabs, Tag, message, notification } from 'antd';
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import { callChangeResumeStatus, callDeleteResume } from '@/config/api';
import { RESUME_STATUS, SHORTLIST_STATUSES, errorMessage } from '@/config/utils';
import queryString from 'query-string';
import { fetchResume } from '@/redux/slice/resumeSlide';
import ViewDetailResume from '@/components/admin/resume/view.resume';
import { ALL_PERMISSIONS } from '@/config/permissions';
import Access from '@/components/share/access';
import { sfIn } from 'spring-filter-query-builder';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const ResumePage = () => {
    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.resume.isFetching);
    const meta = useAppSelector(state => state.resume.meta);
    const resumes = useAppSelector(state => state.resume.result);
    const dispatch = useAppDispatch();

    const [dataInit, setDataInit] = useState<IResume | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
    // "Tất cả hồ sơ" (everyone who applied) and "Shortlist" (shortlisted, interviewing, accepted)
    const [tab, setTab] = useState<'all' | 'shortlist'>('all');

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    // One click from the list: SHORTLISTED (the candidate is e-mailed)
    const shortlist = async (id: string | undefined) => {
        if (!id) return;
        const res = await callChangeResumeStatus(id, { status: 'SHORTLISTED' });
        if (res.data) {
            message.success('Đã đưa vào Shortlist và thông báo cho ứng viên.');
            reloadTable();
        } else {
            notification.error({ message: 'Chưa thể cập nhật hồ sơ', description: errorMessage(res.message) });
        }
    };

    // Only roles holding the DELETE permission see the button (SUPER_ADMIN); an employer cannot erase applications.
    const remove = async (id: string | undefined) => {
        if (!id) return;
        const res = await callDeleteResume(id);
        if (+res.statusCode === 200) {
            message.success('Đã xóa hồ sơ ứng tuyển.');
            reloadTable();
        } else {
            notification.error({ message: 'Chưa thể xóa hồ sơ', description: errorMessage(res.message) });
        }
    };

    const columns: ProColumns<IResume>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 50,
            render: (text, record) => {
                return (
                    <a
                        href="#"
                        onClick={() => {
                            setOpenViewDetail(true);
                            setDataInit(record);
                        }}
                    >
                        {record.id}
                    </a>
                );
            },
            hideInSearch: true,
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            sorter: true,
            render: (_t, record) => (
                <Tag color={RESUME_STATUS[record.status]?.color} style={{ margin: 0 }}>
                    {RESUME_STATUS[record.status]?.label ?? record.status}
                </Tag>
            ),
            renderFormItem: () => (
                <ProFormSelect
                    showSearch
                    mode="multiple"
                    allowClear
                    valueEnum={Object.fromEntries(
                        Object.entries(RESUME_STATUS).map(([key, value]) => [key, value.label]),
                    )}
                    placeholder="Chọn trạng thái"
                />
            ),
        },

        {
            title: 'Ứng viên',
            dataIndex: ['user', 'name'],
            hideInSearch: true,
            render: (_t, record) => (
                <span>
                    {record.user?.name}
                    {record.applicantPlan && (
                        <Tag color="orange" style={{ marginLeft: 6 }}>
                            Premium
                        </Tag>
                    )}
                    <br />
                    <small style={{ color: 'var(--muted)' }}>{record.email}</small>
                </span>
            ),
        },
        {
            title: 'Việc làm',
            dataIndex: ['job', 'name'],
            hideInSearch: true,
        },
        {
            title: 'Điểm',
            dataIndex: 'score',
            width: 70,
            hideInSearch: true,
            render: (_t, record) =>
                record.score ? <strong>{record.score}/10</strong> : <span style={{ color: 'var(--muted)' }}>—</span>,
        },
        {
            title: 'Công ty',
            dataIndex: 'companyName',
            hideInSearch: true,
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
            width: 190,
            render: (_value, entity, _index, _action) => (
                <Space>
                    {(entity.status === 'PENDING' || entity.status === 'REVIEWING') && (
                        <Access permission={ALL_PERMISSIONS.RESUMES.CHANGE_STATUS} hideChildren>
                            <Popconfirm
                                title="Đưa vào Shortlist?"
                                description="Ứng viên sẽ nhận email thông báo."
                                okText="Đưa vào"
                                cancelText="Hủy"
                                onConfirm={() => shortlist(entity.id)}
                            >
                                <Button size="small" type="primary">
                                    Shortlist
                                </Button>
                            </Popconfirm>
                        </Access>
                    )}
                    <EditOutlined
                        style={{
                            fontSize: 20,
                            color: '#ffa500',
                        }}
                        type=""
                        onClick={() => {
                            setOpenViewDetail(true);
                            setDataInit(entity);
                        }}
                    />

                    <Access permission={ALL_PERMISSIONS.RESUMES.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xóa hồ sơ ứng tuyển?"
                            description="Hồ sơ biến mất khỏi danh sách của ứng viên và nhà tuyển dụng. Không thể hoàn tác."
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => remove(entity.id)}
                        >
                            <DeleteOutlined
                                style={{ fontSize: 20, color: '#ff4d4f', cursor: 'pointer' }}
                                aria-label="Xóa hồ sơ ứng tuyển"
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    const buildQuery = (params: any, sort: any, _filter: any) => {
        const clone = { ...params };

        const filters: string[] = [];
        if (tab === 'shortlist') filters.push(sfIn('status', SHORTLIST_STATUSES).toString());
        if (clone?.status?.length) {
            filters.push(sfIn('status', clone.status).toString());
        }
        delete clone.status;
        if (filters.length) clone.filter = filters.join(' and ');

        clone.page = clone.current;
        clone.size = clone.pageSize;

        delete clone.current;
        delete clone.pageSize;

        let temp = queryString.stringify(clone);

        let sortBy = '';
        if (sort && sort.status) {
            sortBy = sort.status === 'ascend' ? 'sort=status,asc' : 'sort=status,desc';
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

        // temp += "&populate=companyId,jobId&fields=companyId.id, companyId.name, companyId.logo, jobId.id, jobId.name";
        return temp;
    };

    return (
        <div>
            <Tabs
                activeKey={tab}
                onChange={key => {
                    setTab(key as 'all' | 'shortlist');
                    setTimeout(reloadTable, 0);
                }}
                items={[
                    { key: 'all', label: 'Tất cả hồ sơ' },
                    { key: 'shortlist', label: 'Shortlist' },
                ]}
            />
            <Access permission={ALL_PERMISSIONS.RESUMES.GET_PAGINATE}>
                <DataTable<IResume>
                    actionRef={tableRef}
                    headerTitle={tab === 'shortlist' ? 'Danh sách Shortlist' : 'Hồ sơ ứng tuyển'}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={resumes}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        dispatch(fetchResume({ query }));
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
                        return <></>;
                    }}
                />
            </Access>
            <ViewDetailResume
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={reloadTable}
            />
        </div>
    );
};

export default ResumePage;
