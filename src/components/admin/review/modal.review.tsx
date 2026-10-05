import { ModalForm, ProForm, ProFormTextArea } from '@ant-design/pro-components';
import { Form, Rate, message, notification } from 'antd';
import { useIsMobile } from '@/config/use-mobile';
import { callCreateReview, callUpdateReview } from '@/config/api';
import { errorMessage } from '@/config/utils';
import { IReview } from '@/types/backend';
import { DebounceSelect } from '../user/debouce.select';
import { searchCompanies, searchUsers } from '../pickers';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IReview | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalReview = ({ openModal, setOpenModal, dataInit, setDataInit, reloadTable }: IProps) => {
    const isMobile = useIsMobile();
    const [form] = Form.useForm();
    const editing = Boolean(dataInit?.id);
    const user = dataInit ? { label: dataInit.user.name, value: String(dataInit.user.id) } : undefined;
    const company = dataInit ? { label: dataInit.company.name, value: String(dataInit.company.id) } : undefined;

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const submit = async (values: any) => {
        const payload = {
            userId: Number(values.user.value),
            companyId: Number(values.company.value),
            rating: values.rating as number,
            content: String(values.content).trim(),
        };
        const res = editing
            ? await callUpdateReview({ ...payload, id: dataInit!.id })
            : await callCreateReview(payload);
        if (res.data) {
            message.success(editing ? 'Cập nhật đánh giá thành công' : 'Thêm đánh giá thành công');
            handleReset();
            reloadTable();
        } else {
            notification.error({ message: 'Có lỗi xảy ra', description: errorMessage(res.message) });
        }
    };

    return (
        <ModalForm
            title={editing ? 'Cập nhật đánh giá' : 'Thêm đánh giá'}
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
            initialValues={editing ? { user, company, rating: dataInit!.rating, content: dataInit!.content } : {}}
        >
            <ProForm.Item
                name="user"
                label="Người đánh giá"
                rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
            >
                <DebounceSelect
                    showSearch
                    allowClear
                    disabled={editing}
                    defaultValue={user}
                    placeholder="Tìm theo tên người dùng"
                    fetchOptions={searchUsers}
                    style={{ width: '100%' }}
                />
            </ProForm.Item>
            <ProForm.Item name="company" label="Công ty" rules={[{ required: true, message: 'Vui lòng chọn công ty' }]}>
                <DebounceSelect
                    showSearch
                    allowClear
                    disabled={editing}
                    defaultValue={company}
                    placeholder="Tìm theo tên công ty"
                    fetchOptions={searchCompanies}
                    style={{ width: '100%' }}
                />
            </ProForm.Item>
            <ProForm.Item name="rating" label="Số sao" rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}>
                <Rate />
            </ProForm.Item>
            <ProFormTextArea
                name="content"
                label="Nội dung"
                placeholder="Nhập nội dung đánh giá"
                fieldProps={{ rows: 4, maxLength: 1000, showCount: true }}
                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập nội dung' }]}
            />
        </ModalForm>
    );
};

export default ModalReview;
