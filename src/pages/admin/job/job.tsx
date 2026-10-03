import DataTable from '@/components/client/data-table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IJob } from '@/types/backend';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, message, notification } from 'antd';
import { useRef } from 'react';
import dayjs from 'dayjs';
import { callDeleteJob } from '@/config/api';
import queryString from 'query-string';
import { useNavigate } from 'react-router-dom';
import { fetchJob } from '@/redux/slice/jobSlide';
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { sfIn } from 'spring-filter-query-builder';
import { JOB_STATE, formatSalary, jobState } from '@/config/utils';

const JobPage = () => {
    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.job.isFetching);
    const meta = useAppSelector(state => state.job.meta);
    const jobs = useAppSelector(state => state.job.result);
    const company = useAppSelector(state => state.account.user.company);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleDeleteJob = async (id: string | undefined) => {
        if (id) {
            const res = await callDeleteJob(id);
            if (res && res.data) {
                message.success('Xóa việc làm thành công');
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        }
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<IJob>[] = [
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
            title: 'Tên vị trí',
            dataIndex: 'name',
            sorter: true,
            render: (_, record) => (
                <>
                    {record.name}
                    {record.locked && (
                        <Tag color="red" style={{ marginLeft: 8 }} title={record.lockReason ?? undefined}>
                            Bị khóa
                        </Tag>
                    )}
                </>
            ),
        },
        {
            title: 'Công ty',
            dataIndex: ['company', 'name'],
            sorter: true,
            hideInSearch: true,
        },
        {
            title: 'Mức lương',
            dataIndex: 'salary',
            sorter: true,
            render(dom, entity) {
                return <>{formatSalary(entity.salary, entity.salaryMax)}</>;
            },
        },
        // {
        //     title: 'Level',
        //     dataIndex: 'level',
        //     renderFormItem: (item, props, form) => (
        //         <ProFormSelect
        //             showSearch
        //             mode="multiple"
        //             allowClear
        //             valueEnum={{
        //                 INTERN: 'INTERN',
        //                 FRESHER: 'FRESHER',
        //                 JUNIOR: 'JUNIOR',
        //                 MIDDLE: 'MIDDLE',
        //                 SENIOR: 'SENIOR',
        //             }}
        //             placeholder="Chọn level"
        //         />
        //     ),
        // },
        {
            title: 'Trạng thái',
            dataIndex: 'active',
            width: 170,
            render(dom, entity) {
                const state = jobState(entity);
                const hint =
                    state === 'SCHEDULED'
                        ? `Hiện công khai từ ${dayjs(entity.startDate).format('DD/MM/YYYY')}`
                        : state === 'EXPIRED'
                          ? `Hết hạn ${dayjs(entity.endDate).format('DD/MM/YYYY')}`
                          : state === 'LOCKED'
                            ? entity.lockReason || 'Bị quản trị viên khóa'
                            : state === 'PAUSED'
                              ? 'Đang tạm ẩn, không hiện công khai'
                              : null;
                return (
                    <>
                        <Tag color={JOB_STATE[state].color} style={{ margin: 0 }}>
                            {JOB_STATE[state].label}
                        </Tag>
                        {hint && (
                            <div style={{ marginTop: 2, color: 'var(--muted)', fontSize: 12, lineHeight: 1.3 }}>
                                {hint}
                            </div>
                        )}
                    </>
                );
            },
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
            width: 50,
            render: (_value, entity, _index, _action) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.JOBS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{
                                fontSize: 20,
                                color: '#ffa500',
                            }}
                            type=""
                            onClick={() => {
                                navigate(`/admin/job/upsert?id=${entity.id}`);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.JOBS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title={'Xóa việc làm'}
                            description={'Bạn có chắc chắn muốn xóa việc làm này?'}
                            onConfirm={() => handleDeleteJob(entity.id)}
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
        if (company) parts.push(`company.id : ${company.id}`);
        if (clone.name) parts.push(`name ~ '${clone.name}'`);
        if (clone.salary) parts.push(`salary ~ '${clone.salary}'`);
        if (clone?.level?.length) {
            parts.push(`${sfIn('level', clone.level).toString()}`);
        }

        clone.filter = parts.join(' and ');
        if (!clone.filter) delete clone.filter;

        clone.page = clone.current;
        clone.size = clone.pageSize;

        delete clone.current;
        delete clone.pageSize;
        delete clone.name;
        delete clone.salary;
        delete clone.level;

        let temp = queryString.stringify(clone);

        let sortBy = '';
        const fields = ['name', 'salary', 'createdAt', 'updatedAt'];
        if (sort) {
            for (const field of fields) {
                if (sort[field]) {
                    sortBy = `sort=${field},${sort[field] === 'ascend' ? 'asc' : 'desc'}`;
                    break; // Remove this if you want to handle multiple sort parameters
                }
            }
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
            <Access permission={ALL_PERMISSIONS.JOBS.GET_PAGINATE}>
                <DataTable<IJob>
                    actionRef={tableRef}
                    headerTitle="Danh sách Việc làm"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={jobs}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        dispatch(fetchJob({ query }));
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
                                    {range[0]}-{range[1]} trên {total} việc làm
                                </div>
                            );
                        },
                    }}
                    rowSelection={false}
                    toolBarRender={(_action, _rows): any => {
                        return (
                            <Access permission={ALL_PERMISSIONS.JOBS.CREATE} hideChildren>
                                <Button
                                    icon={<PlusOutlined />}
                                    type="primary"
                                    disabled={Boolean(company && !company.approved)}
                                    title={
                                        company && !company.approved
                                            ? company.rejectionReason
                                                ? 'Công ty chưa được duyệt, chưa thể đăng tin'
                                                : 'Công ty đang chờ duyệt, chưa thể đăng tin'
                                            : undefined
                                    }
                                    onClick={() => navigate('upsert')}
                                >
                                    Thêm mới
                                </Button>
                            </Access>
                        );
                    }}
                />
            </Access>
        </div>
    );
};

export default JobPage;
