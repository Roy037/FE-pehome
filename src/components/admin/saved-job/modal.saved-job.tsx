import { ModalForm, ProForm } from '@ant-design/pro-components';
import { Form, message, notification } from 'antd';
import { useIsMobile } from '@/config/use-mobile';
import { callCreateSavedJob } from '@/config/api';
import { errorMessage } from '@/config/utils';
import { DebounceSelect } from '../user/debouce.select';
import { searchJobs, searchUsers } from '../pickers';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
}

const ModalSavedJob = ({ openModal, setOpenModal, reloadTable }: IProps) => {
    const isMobile = useIsMobile();
    const [form] = Form.useForm();

    const handleReset = () => {
        form.resetFields();
        setOpenModal(false);
    };

    const submit = async (values: any) => {
        const res = await callCreateSavedJob(Number(values.user.value), Number(values.job.value));
        if (res.data) {
            message.success('Đã thêm việc làm đã lưu');
            handleReset();
            reloadTable();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: errorMessage(res.message) });
        }
    };

    return (
        <ModalForm
            title="Thêm việc làm đã lưu"
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: isMobile ? '100%' : 480,
                keyboard: false,
                maskClosable: false,
                okText: 'Tạo mới',
                cancelText: 'Hủy',
            }}
            scrollToFirstError
            preserve={false}
            form={form}
            onFinish={submit}
        >
            <ProForm.Item
                name="user"
                label="Người dùng"
                rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
            >
                <DebounceSelect
                    showSearch
                    allowClear
                    placeholder="Tìm theo tên người dùng"
                    fetchOptions={searchUsers}
                    style={{ width: '100%' }}
                />
            </ProForm.Item>
            <ProForm.Item name="job" label="Việc làm" rules={[{ required: true, message: 'Vui lòng chọn việc làm' }]}>
                <DebounceSelect
                    showSearch
                    allowClear
                    placeholder="Tìm theo tên việc làm"
                    fetchOptions={searchJobs}
                    style={{ width: '100%' }}
                />
            </ProForm.Item>
        </ModalForm>
    );
};

export default ModalSavedJob;
