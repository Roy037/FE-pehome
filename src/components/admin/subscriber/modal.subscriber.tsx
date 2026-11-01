import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { Form, message, notification } from 'antd';
import { useIsMobile } from '@/config/use-mobile';
import { callCreateSubscriber, callFetchAllSkill, callUpdateSubscriberById } from '@/config/api';
import { errorMessage } from '@/config/utils';
import { ISubscribers } from '@/types/backend';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ISubscribers | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalSubscriber = ({ openModal, setOpenModal, dataInit, setDataInit, reloadTable }: IProps) => {
    const isMobile = useIsMobile();
    const [form] = Form.useForm();
    const editing = Boolean(dataInit?.id);

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const submit = async (values: any) => {
        const payload = {
            name: String(values.name).trim(),
            email: String(values.email).trim(),
            skills: ((values.skills ?? []) as (string | number)[]).map(id => ({ id: String(id) })),
        } as ISubscribers;
        const res = editing
            ? await callUpdateSubscriberById(dataInit!.id!, payload)
            : await callCreateSubscriber(payload);
        if (res.data) {
            message.success(editing ? 'Cập nhật đăng ký thành công' : 'Thêm đăng ký thành công');
            handleReset();
            reloadTable();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: errorMessage(res.message) });
        }
    };

    return (
        <ModalForm
            title={editing ? 'Cập nhật đăng ký nhận tin' : 'Thêm đăng ký nhận tin'}
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: isMobile ? '100%' : 480,
                keyboard: false,
                maskClosable: false,
                okText: editing ? 'Cập nhật' : 'Tạo mới',
                cancelText: 'Hủy',
            }}
            scrollToFirstError
            preserve={false}
            form={form}
            onFinish={submit}
            initialValues={
                editing
                    ? { name: dataInit!.name, email: dataInit!.email, skills: dataInit!.skills.map(skill => skill.id) }
                    : {}
            }
        >
            <ProFormText
                name="name"
                label="Họ và tên"
                placeholder="Nhập họ và tên"
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ tên' }]}
            />
            <ProFormText
                name="email"
                label="Email"
                placeholder="Nhập email"
                rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email chưa hợp lệ' },
                ]}
            />
            <ProFormSelect
                name="skills"
                label="Kỹ năng quan tâm"
                mode="multiple"
                placeholder="Chọn kỹ năng"
                fieldProps={{ showSearch: true, allowClear: true, optionFilterProp: 'label' }}
                request={async () => {
                    const res = await callFetchAllSkill('page=1&size=200&sort=name,asc');
                    return (res.data?.result ?? []).map(skill => ({
                        label: skill.name as string,
                        value: skill.id as string,
                    }));
                }}
            />
        </ModalForm>
    );
};

export default ModalSubscriber;
