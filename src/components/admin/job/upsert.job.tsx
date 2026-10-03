import { Alert, Breadcrumb, Col, ConfigProvider, Divider, Form, Row, message, notification } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DebounceSelect } from '../user/debouce.select';
import {
    FooterToolbar,
    ProForm,
    ProFormDatePicker,
    ProFormDigit,
    ProFormSelect,
    ProFormSwitch,
    ProFormText,
} from '@ant-design/pro-components';
import styles from 'styles/admin.module.scss';
import { EMPLOYMENT_TYPE_LIST, LOCATION_LIST, WORK_MODE_LIST, isNegotiable } from '@/config/utils';
import { ICompanySelect } from '../user/modal.user';
import { useState, useEffect } from 'react';
import { callCreateJob, callFetchAllSkill, callFetchCompany, callFetchJobById, callUpdateJob } from '@/config/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CheckSquareOutlined } from '@ant-design/icons';
import viVN from 'antd/lib/locale/vi_VN';
import dayjs from 'dayjs';
import { IJob, ISkill } from '@/types/backend';
import { useAppSelector } from '@/redux/hooks';

interface ISkillSelect {
    label: string;
    value: string;
    key?: string;
}

const moneyField = {
    addonAfter: ' đ',
    formatter: (value: unknown) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    parser: (value?: string) => +(value || '').replace(/\$\s?|(,*)/g, ''),
};

const ViewUpsertJob = () => {
    const myCompany = useAppSelector(state => state.account.user.company);
    const [companies, setCompanies] = useState<ICompanySelect[]>(() =>
        myCompany ? [{ label: myCompany.name, value: `${myCompany.id}@#$`, key: String(myCompany.id) }] : [],
    );
    const [skills, setSkills] = useState<ISkillSelect[]>([]);

    const navigate = useNavigate();
    const [value, setValue] = useState<string>('');

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params?.get('id'); // job id
    const [dataUpdate, setDataUpdate] = useState<IJob | null>(null);
    const [form] = Form.useForm();
    const negotiable = Form.useWatch('negotiable', form);

    useEffect(() => {
        const init = async () => {
            const temp = await fetchSkillList();
            setSkills(temp);

            if (myCompany && !id) {
                const mine = { label: myCompany.name, value: `${myCompany.id}@#$`, key: String(myCompany.id) };
                setCompanies([mine]);
                form.setFieldsValue({ company: mine });
            }

            if (id) {
                const res = await callFetchJobById(id);
                if (res && res.data) {
                    setDataUpdate(res.data);
                    setValue(res.data.description);
                    setCompanies([
                        {
                            label: res.data.company?.name as string,
                            value: `${res.data.company?.id}@#$${res.data.company?.logo}` as string,
                            key: res.data.company?.id,
                        },
                    ]);

                    //skills
                    const temp: any = res.data?.skills?.map((item: ISkill) => {
                        return {
                            label: item.name,
                            value: item.id,
                            key: item.id,
                        };
                    });
                    form.setFieldsValue({
                        ...res.data,
                        negotiable: isNegotiable(res.data.salary, res.data.salaryMax),
                        salaryMax: res.data.salaryMax || undefined,
                        company: {
                            label: res.data.company?.name as string,
                            value: `${res.data.company?.id}@#$${res.data.company?.logo}` as string,
                            key: res.data.company?.id,
                        },
                        skills: temp,
                    });
                }
            }
        };
        init();
        return () => form.resetFields();
    }, [id]);

    // Usage of DebounceSelect
    async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
        const res = await callFetchCompany(`page=1&size=100&name ~ '${name}'`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: `${item.id}@#$${item.logo}` as string,
                };
            });
            return temp;
        } else return [];
    }

    async function fetchSkillList(): Promise<ISkillSelect[]> {
        const res = await callFetchAllSkill(`page=1&size=100`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: `${item.id}` as string,
                };
            });
            return temp;
        } else return [];
    }

    const onFinish = async (values: any) => {
        if (dataUpdate?.id) {
            //update
            const cp = values?.company?.value?.split('@#$');

            let arrSkills;
            if (typeof values?.skills?.[0] === 'object') {
                arrSkills = values?.skills?.map((item: any) => {
                    return { id: item.value };
                });
            } else {
                arrSkills = values?.skills?.map((item: any) => {
                    return { id: +item };
                });
            }

            const job = {
                name: values.name,
                skills: arrSkills,
                company: {
                    id: cp && cp.length > 0 ? cp[0] : '',
                    name: values.company.label,
                    logo: cp && cp.length > 1 ? cp[1] : '',
                },
                location: values.location,
                salary: values.negotiable ? 0 : (values.salary ?? 0),
                salaryMax: values.negotiable ? null : values.salaryMax || null,
                quantity: values.quantity,
                level: values.level,
                employmentType: values.employmentType ?? null,
                workMode: values.workMode ?? null,
                description: value,
                startDate: /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(values.startDate)
                    ? dayjs(values.startDate, 'DD/MM/YYYY').toDate()
                    : values.startDate,
                endDate: /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(values.endDate)
                    ? dayjs(values.endDate, 'DD/MM/YYYY').endOf('day').toDate()
                    : values.endDate,
                active: values.active,
            };

            const res = await callUpdateJob(job, dataUpdate.id);
            if (res.data) {
                message.success('Cập nhật tin tuyển dụng thành công');
                navigate('/admin/job');
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        } else {
            //create
            const cp = values?.company?.value?.split('@#$');
            const arrSkills = values?.skills?.map((item: string) => {
                return { id: +item };
            });
            const job = {
                name: values.name,
                skills: arrSkills,
                company: {
                    id: cp && cp.length > 0 ? cp[0] : '',
                    name: values.company.label,
                    logo: cp && cp.length > 1 ? cp[1] : '',
                },
                location: values.location,
                salary: values.negotiable ? 0 : (values.salary ?? 0),
                salaryMax: values.negotiable ? null : values.salaryMax || null,
                quantity: values.quantity,
                level: values.level,
                employmentType: values.employmentType ?? null,
                workMode: values.workMode ?? null,
                description: value,
                startDate: dayjs(values.startDate, 'DD/MM/YYYY').toDate(),
                // the deadline day itself still counts: the posting closes at the end of that day, not at its start
                endDate: dayjs(values.endDate, 'DD/MM/YYYY').endOf('day').toDate(),
                active: values.active,
            };

            const res = await callCreateJob(job);
            if (res.data) {
                message.success('Đăng tin tuyển dụng thành công');
                navigate('/admin/job');
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        }
    };

    return (
        <div className={styles['upsert-job-container']}>
            <div className={styles['title']}>
                <Breadcrumb
                    separator=">"
                    items={[
                        {
                            title: <Link to="/admin/job">Quản lý Việc làm</Link>,
                        },
                        {
                            title: dataUpdate?.id ? 'Cập nhật tin tuyển dụng' : 'Đăng tin tuyển dụng',
                        },
                    ]}
                />
            </div>
            {dataUpdate?.locked && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Tin này đang bị quản trị viên khóa"
                    description={
                        <>
                            Tin không hiển thị công khai và không nhận hồ sơ mới. Lý do:{' '}
                            <strong>{dataUpdate.lockReason}</strong>. Bạn vẫn sửa được nội dung; liên hệ quản trị viên
                            để mở khóa.
                        </>
                    }
                />
            )}
            <div>
                <ConfigProvider locale={viVN}>
                    <ProForm
                        form={form}
                        onFinish={onFinish}
                        submitter={{
                            searchConfig: {
                                resetText: 'Hủy',
                                submitText: <>{dataUpdate?.id ? 'Cập nhật tin' : 'Đăng tin tuyển dụng'}</>,
                            },
                            onReset: () => navigate('/admin/job'),
                            render: (_: any, dom: any) => <FooterToolbar>{dom}</FooterToolbar>,
                            submitButtonProps: {
                                icon: <CheckSquareOutlined />,
                            },
                        }}
                    >
                        <Row gutter={[20, 20]}>
                            <Col span={24} md={12}>
                                <ProFormText
                                    label="Tên vị trí / chức danh"
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="VD: Frontend Developer, Data Analyst…"
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormSelect
                                    name="skills"
                                    label="Kỹ năng yêu cầu"
                                    options={skills}
                                    placeholder="Chọn kỹ năng"
                                    rules={[{ required: true, message: 'Vui lòng chọn ít nhất một kỹ năng!' }]}
                                    allowClear
                                    mode="multiple"
                                    fieldProps={{
                                        suffixIcon: null,
                                    }}
                                />
                            </Col>

                            <Col span={24} md={12} xl={6}>
                                <ProFormSelect
                                    name="location"
                                    label="Địa điểm"
                                    options={LOCATION_LIST.filter(item => item.value !== 'ALL')}
                                    placeholder="Chọn địa điểm"
                                    rules={[{ required: true, message: 'Vui lòng chọn địa điểm!' }]}
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormSelect
                                    name="employmentType"
                                    label="Hình thức làm việc"
                                    options={EMPLOYMENT_TYPE_LIST}
                                    placeholder="Chọn hình thức"
                                    allowClear
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormSelect
                                    name="workMode"
                                    label="Nơi làm việc"
                                    options={WORK_MODE_LIST}
                                    placeholder="Chọn nơi làm việc"
                                    allowClear
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormDigit
                                    label="Lương tối thiểu (đ/tháng)"
                                    name="salary"
                                    disabled={negotiable}
                                    min={0}
                                    rules={
                                        negotiable
                                            ? []
                                            : [
                                                  {
                                                      required: true,
                                                      message: 'Nhập mức tối thiểu hoặc chọn "Lương thỏa thuận"',
                                                  },
                                              ]
                                    }
                                    placeholder="VD: 15000000"
                                    fieldProps={{ ...moneyField }}
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormDigit
                                    label="Lương tối đa (đ/tháng)"
                                    name="salaryMax"
                                    disabled={negotiable}
                                    min={0}
                                    dependencies={['salary']}
                                    rules={
                                        negotiable
                                            ? []
                                            : [
                                                  ({ getFieldValue }) => ({
                                                      validator: (_, value) =>
                                                          !value ||
                                                          !getFieldValue('salary') ||
                                                          value >= getFieldValue('salary')
                                                              ? Promise.resolve()
                                                              : Promise.reject(
                                                                    new Error(
                                                                        'Lương tối đa phải lớn hơn hoặc bằng mức tối thiểu',
                                                                    ),
                                                                ),
                                                  }),
                                              ]
                                    }
                                    placeholder="Để trống nếu chỉ có mức tối thiểu"
                                    fieldProps={{ ...moneyField }}
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormSwitch
                                    name="negotiable"
                                    label="Lương thỏa thuận"
                                    tooltip="Bật nếu không công bố mức lương; tin sẽ hiển thị 'Thỏa thuận'."
                                    fieldProps={{
                                        onChange: (on: boolean) => {
                                            if (on) form.setFieldsValue({ salary: 0, salaryMax: undefined });
                                        },
                                    }}
                                />
                            </Col>
                            {/* <Col span={24} md={12} xl={6}>
                                <ProFormDigit
                                    label="Số lượng"
                                    name="quantity"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập số lượng"
                                />
                            </Col> */}
                            {/* <Col span={24} md={12} xl={6}>
                                <ProFormSelect
                                    name="level"
                                    label="Trình độ"
                                    valueEnum={{
                                        INTERN: 'INTERN',
                                        FRESHER: 'FRESHER',
                                        JUNIOR: 'JUNIOR',
                                        MIDDLE: 'MIDDLE',
                                        SENIOR: 'SENIOR',
                                    }}
                                    placeholder="Chọn cấp bậc"
                                    rules={[{ required: true, message: 'Vui lòng chọn level!' }]}
                                />
                            </Col> */}

                            {(dataUpdate?.id || !id) && (
                                <Col span={24} md={12} xl={6}>
                                    <ProForm.Item
                                        name="company"
                                        label="Công ty"
                                        rules={[{ required: true, message: 'Vui lòng chọn công ty!' }]}
                                    >
                                        <DebounceSelect
                                            allowClear
                                            showSearch
                                            defaultValue={companies}
                                            value={companies}
                                            disabled={Boolean(myCompany)}
                                            placeholder="Chọn công ty"
                                            fetchOptions={fetchCompanyList}
                                            onChange={(newValue: any) => {
                                                if (newValue?.length === 0 || newValue?.length === 1) {
                                                    setCompanies(newValue as ICompanySelect[]);
                                                }
                                            }}
                                            style={{ width: '100%' }}
                                        />
                                    </ProForm.Item>
                                </Col>
                            )}
                        </Row>
                        <Row gutter={[20, 20]}>
                            <Col span={24} md={12} xl={6}>
                                <ProFormDatePicker
                                    label="Ngày bắt đầu"
                                    name="startDate"
                                    tooltip="Tin chỉ hiện công khai từ ngày này. Chọn ngày trong tương lai là hẹn đăng."
                                    normalize={value => value && dayjs(value, 'DD/MM/YYYY')}
                                    fieldProps={{
                                        format: 'DD/MM/YYYY',
                                    }}
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                                    placeholder="dd/mm/yyyy"
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormDatePicker
                                    label="Ngày kết thúc"
                                    name="endDate"
                                    normalize={value => value && dayjs(value, 'DD/MM/YYYY')}
                                    fieldProps={{
                                        format: 'DD/MM/YYYY',
                                    }}
                                    // width="auto"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                                    placeholder="dd/mm/yyyy"
                                />
                            </Col>
                            <Col span={24} md={12} xl={6}>
                                <ProFormSwitch
                                    label="Trạng thái"
                                    name="active"
                                    checkedChildren="Đang tuyển"
                                    unCheckedChildren="Tạm ẩn"
                                    initialValue={true}
                                    fieldProps={{
                                        defaultChecked: true,
                                    }}
                                />
                            </Col>
                            <Col span={24}>
                                <ProForm.Item
                                    name="description"
                                    label="Mô tả công việc"
                                    rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc!' }]}
                                >
                                    <ReactQuill theme="snow" value={value} onChange={setValue} />
                                </ProForm.Item>
                            </Col>
                        </Row>
                        <Divider />
                    </ProForm>
                </ConfigProvider>
            </div>
        </div>
    );
};

export default ViewUpsertJob;
