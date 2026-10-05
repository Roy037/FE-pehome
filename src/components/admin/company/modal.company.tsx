import { CheckSquareOutlined, LoadingOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
    FooterToolbar,
    ModalForm,
    ProCard,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Col, ConfigProvider, Form, Modal, Row, Upload, message, notification } from 'antd';
import 'styles/reset.scss';
import { useIsMobile } from '@/config/use-mobile';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState } from 'react';
import { callCreateCompany, callFetchCompanyVerification, callUpdateCompany, callUploadSingleFile } from '@/config/api';
import CvViewerModal from '@/components/client/cv-viewer';
import { useAppDispatch } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import { ICompany } from '@/types/backend';
import { COMPANY_TYPE_LIST } from '@/config/utils';
import { v4 as uuidv4 } from 'uuid';
import viVN from 'antd/lib/locale/vi_VN';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ICompany | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

type ICompanyForm = Omit<ICompany, 'id' | 'logo'>;

const WEBSITE_RULE = { pattern: /^(https?:\/\/\S+)?$/, message: 'Website phải bắt đầu bằng http:// hoặc https://' };
const TAX_RULE = { pattern: /^(\d{10}(-\d{3})?)?$/, message: 'Gồm 10 chữ số, hoặc 13 chữ số dạng 0123456789-001' };
const PHONE_RULE = { pattern: /^((\+84|0)\d{9,10})?$/, message: 'Số điện thoại chưa hợp lệ' };
const MAP_RULE = {
    pattern:
        /^(https:\/\/www\.google\.com\/maps\/embed(\/v1\/\w+)?\?[^\s"'<>]+|https:\/\/maps\.google\.com\/maps\?[^\s"'<>]*output=embed[^\s"'<>]*)?$/,
    message: 'Hãy dán URL nhúng của Google Maps (Chia sẻ > Nhúng bản đồ)',
};
const extractMapSrc = (value?: string) => (value?.match(/<iframe[^>]*\ssrc="([^"]+)"/i)?.[1] ?? value ?? '').trim();

const SOCIAL_FIELDS = [
    { name: 'facebookUrl', label: 'Facebook', host: 'facebook\\.com' },
    { name: 'linkedinUrl', label: 'LinkedIn', host: 'linkedin\\.com' },
    { name: 'twitterUrl', label: 'Twitter / X', host: '(twitter|x)\\.com' },
    { name: 'pinterestUrl', label: 'Pinterest', host: 'pinterest\\.com' },
    { name: 'instagramUrl', label: 'Instagram', host: 'instagram\\.com' },
    { name: 'youtubeUrl', label: 'YouTube', host: '(youtube\\.com|youtu\\.be)' },
];

interface ICompanyLogo {
    name: string;
    uid: string;
}

const ModalCompany = (props: IProps) => {
    const isMobile = useIsMobile();
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const dispatch = useAppDispatch();

    //modal animation
    const [animation, setAnimation] = useState<string>('open');

    const [loadingUpload, setLoadingUpload] = useState<boolean>(false);
    const [dataLogo, setDataLogo] = useState<ICompanyLogo[]>([]);
    const [banner, setBanner] = useState<string>(dataInit?.banner ?? '');
    const [loadingBanner, setLoadingBanner] = useState<boolean>(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    const [value, setValue] = useState<string>('');
    const [form] = Form.useForm();

    // business licence: the stored name once a new file is uploaded, and whether a saved one exists on the server
    const [license, setLicense] = useState('');
    const [licenseName, setLicenseName] = useState('');
    const [uploadingLicense, setUploadingLicense] = useState(false);
    const [hasLicense, setHasLicense] = useState(false);
    const [viewLicense, setViewLicense] = useState(false);

    useEffect(() => {
        if (dataInit?.id) {
            setValue(dataInit.description ?? '');
            form.setFieldsValue({
                name: dataInit.name,
                address: dataInit.address,
            });
            setDataLogo(
                dataInit.logo
                    ? [
                          {
                              name: dataInit.logo,
                              uid: uuidv4(),
                          },
                      ]
                    : [],
            );
        }
    }, [dataInit]);

    useEffect(() => setBanner(dataInit?.banner ?? ''), [dataInit]);

    // the phone and the licence are not part of the public company data: ask the verification endpoint
    useEffect(() => {
        setLicense('');
        setLicenseName('');
        setHasLicense(false);
        if (!dataInit?.id) return;
        form.setFieldsValue({ taxCode: dataInit.taxCode });
        (async () => {
            try {
                const res = await callFetchCompanyVerification(dataInit.id!);
                form.setFieldsValue({ phone: res.data?.phone ?? undefined });
                setHasLicense(Boolean(res.data?.hasLicense));
            } catch {
                // the form still works without these two
            }
        })();
    }, [dataInit, form]);

    const uploadLicense = async (file: File) => {
        if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
            message.error('Giấy phép cần là PDF hoặc ảnh JPG, PNG, WEBP.');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error('Giấy phép tối đa 5 MB.');
            return false;
        }
        setUploadingLicense(true);
        try {
            const res = await callUploadSingleFile(file, 'company-doc');
            if (res.data?.fileName) {
                setLicense(res.data.fileName);
                setLicenseName(file.name);
            } else {
                message.error(Array.isArray(res.message) ? res.message[0] : res.message || 'Chưa tải được giấy phép.');
            }
        } catch {
            message.error('Chưa tải được giấy phép. Vui lòng thử lại.');
        } finally {
            setUploadingLicense(false);
        }
        return false;
    };

    const submitCompany = async (valuesForm: ICompanyForm) => {
        const { name, address, ...profile } = valuesForm;
        const trimmed = Object.fromEntries(
            Object.entries(profile).map(([key, val]) => [key, typeof val === 'string' ? val.trim() : val]),
        );

        if (dataLogo.length === 0) {
            message.error('Vui lòng upload ảnh Logo');
            return;
        }

        if (dataInit?.id) {
            //update
            const res = await callUpdateCompany({
                ...trimmed,
                id: dataInit.id,
                name,
                address,
                description: value,
                logo: dataLogo[0].name,
                banner,
                licenseFile: license || undefined,
            });
            if (res.data) {
                message.success('Cập nhật company thành công');
                dispatch(fetchAccount());
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        } else {
            //create
            const res = await callCreateCompany({
                ...trimmed,
                name,
                address,
                description: value,
                logo: dataLogo[0].name,
                banner,
                licenseFile: license || undefined,
            });
            if (res.data) {
                message.success('Thêm mới company thành công');
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message,
                });
            }
        }
    };

    const handleReset = async () => {
        form.resetFields();
        setValue('');
        setDataInit(null);

        //add animation when closing modal
        setAnimation('close');
        await new Promise(r => setTimeout(r, 400));
        setOpenModal(false);
        setAnimation('open');
    };

    const handleRemoveFile = () => {
        setDataLogo([]);
    };

    const handlePreview = async (file: any) => {
        if (!file.originFileObj) {
            setPreviewImage(file.url);
            setPreviewOpen(true);
            setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
            return;
        }
        getBase64(file.originFileObj, (url: string) => {
            setPreviewImage(url);
            setPreviewOpen(true);
            setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
        });
    };

    const getBase64 = (img: any, callback: any) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(img);
    };

    const beforeUpload = (file: any) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M;
    };

    const handleChange = (info: any) => {
        if (info.file.status === 'uploading') {
            setLoadingUpload(true);
        }
        if (info.file.status === 'done') {
            setLoadingUpload(false);
        }
        if (info.file.status === 'error') {
            setLoadingUpload(false);
            message.error(info?.file?.error?.event?.message ?? 'Đã có lỗi xảy ra khi upload file.');
        }
    };

    const handleUploadBanner = async ({ file, onSuccess, onError }: any) => {
        setLoadingBanner(true);
        const res = await callUploadSingleFile(file, 'company');
        setLoadingBanner(false);
        if (res && res.data) {
            setBanner(res.data.fileName);
            if (onSuccess) onSuccess('ok');
        } else if (onError) {
            onError({ event: new Error(res.message) });
        }
    };

    const handleUploadFileLogo = async ({ file, onSuccess, onError }: any) => {
        const res = await callUploadSingleFile(file, 'company');
        if (res && res.data) {
            setDataLogo([
                {
                    name: res.data.fileName,
                    uid: uuidv4(),
                },
            ]);
            if (onSuccess) onSuccess('ok');
        } else {
            if (onError) {
                setDataLogo([]);
                const error = new Error(res.message);
                onError({ event: error });
            }
        }
    };

    return (
        <>
            {openModal && (
                <>
                    <ModalForm
                        title={<>{dataInit?.id ? 'Cập nhật Company' : 'Tạo mới Company'}</>}
                        open={openModal}
                        modalProps={{
                            onCancel: () => {
                                handleReset();
                            },
                            afterClose: () => handleReset(),
                            destroyOnClose: true,
                            width: isMobile ? '100%' : 720,
                            footer: null,
                            keyboard: false,
                            maskClosable: false,
                            className: `modal-company ${animation}`,
                            rootClassName: `modal-company-root ${animation}`,
                        }}
                        scrollToFirstError={true}
                        preserve={false}
                        form={form}
                        onFinish={submitCompany}
                        initialValues={dataInit?.id ? dataInit : {}}
                        submitter={{
                            render: (_: any, dom: any) => <FooterToolbar>{dom}</FooterToolbar>,
                            submitButtonProps: {
                                icon: <CheckSquareOutlined />,
                            },
                            searchConfig: {
                                resetText: 'Hủy',
                                submitText: <>{dataInit?.id ? 'Cập nhật' : 'Tạo mới'}</>,
                            },
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={24}>
                                <ProFormText
                                    label="Tên công ty"
                                    name="name"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập tên công ty"
                                />
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    labelCol={{ span: 24 }}
                                    label="Ảnh Logo"
                                    name="logo"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng không bỏ trống',
                                            validator: () => {
                                                if (dataLogo.length > 0) return Promise.resolve();
                                                else return Promise.reject(false);
                                            },
                                        },
                                    ]}
                                >
                                    <ConfigProvider locale={viVN}>
                                        <Upload
                                            name="logo"
                                            listType="picture-card"
                                            className="avatar-uploader"
                                            maxCount={1}
                                            multiple={false}
                                            customRequest={handleUploadFileLogo}
                                            beforeUpload={beforeUpload}
                                            onChange={handleChange}
                                            onRemove={handleRemoveFile}
                                            onPreview={handlePreview}
                                            defaultFileList={
                                                dataInit?.id
                                                    ? [
                                                          {
                                                              uid: uuidv4(),
                                                              name: dataInit?.logo ?? '',
                                                              status: 'done',
                                                              url: `${import.meta.env.VITE_BACKEND_URL}/storage/company/${dataInit?.logo}`,
                                                          },
                                                      ]
                                                    : []
                                            }
                                        >
                                            <div>
                                                {loadingUpload ? <LoadingOutlined /> : <PlusOutlined />}
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        </Upload>
                                    </ConfigProvider>
                                </Form.Item>
                            </Col>

                            <Col span={16}>
                                <ProFormTextArea
                                    label="Địa chỉ"
                                    name="address"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập địa chỉ công ty"
                                    fieldProps={{
                                        autoSize: { minRows: 4 },
                                    }}
                                />
                            </Col>

                            <Col span={8}>
                                <ProFormSelect
                                    label="Loại hình công ty"
                                    name="companyType"
                                    options={COMPANY_TYPE_LIST}
                                    allowClear
                                    placeholder="Chọn loại hình"
                                />
                            </Col>
                            <Col span={16}>
                                <ProFormText
                                    label="Website"
                                    name="website"
                                    rules={[WEBSITE_RULE]}
                                    placeholder="https://congty.vn"
                                />
                            </Col>
                            <Col span={12}>
                                <ProFormText
                                    label="Mã số thuế"
                                    name="taxCode"
                                    rules={[TAX_RULE]}
                                    placeholder="0123456789"
                                    extra="Dùng để quản trị viên xác minh công ty."
                                />
                            </Col>
                            <Col span={12}>
                                <ProFormText
                                    label="Số điện thoại công ty"
                                    name="phone"
                                    rules={[PHONE_RULE]}
                                    placeholder="0901234567"
                                    extra="Chỉ quản trị viên xem được."
                                />
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Giấy phép kinh doanh"
                                    extra="PDF hoặc ảnh, tối đa 5 MB. Không công khai: chỉ quản trị viên và công ty bạn xem được."
                                >
                                    <Upload
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        showUploadList={false}
                                        maxCount={1}
                                        beforeUpload={uploadLicense}
                                    >
                                        <Button icon={uploadingLicense ? <LoadingOutlined /> : <UploadOutlined />}>
                                            {hasLicense || license ? 'Tải tệp khác' : 'Tải giấy phép'}
                                        </Button>
                                    </Upload>
                                    {license && (
                                        <span style={{ marginLeft: 12 }}>
                                            Đã chọn: {licenseName}. Bấm Cập nhật để lưu.
                                        </span>
                                    )}
                                    {!license && hasLicense && dataInit?.id && (
                                        <Button type="link" onClick={() => setViewLicense(true)}>
                                            Xem giấy phép đã lưu
                                        </Button>
                                    )}
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <ProFormTextArea
                                    label="URL nhúng Google Maps"
                                    name="mapEmbedUrl"
                                    rules={[MAP_RULE]}
                                    normalize={extractMapSrc}
                                    tooltip="Google Maps > Chia sẻ > Nhúng bản đồ > sao chép HTML hoặc chỉ URL trong src"
                                    placeholder="https://www.google.com/maps/embed?pb=…"
                                    fieldProps={{ autoSize: { minRows: 2 } }}
                                />
                            </Col>
                            {SOCIAL_FIELDS.map(field => (
                                <Col span={12} key={field.name}>
                                    <ProFormText
                                        label={field.label}
                                        name={field.name}
                                        placeholder="https://…"
                                        rules={[
                                            {
                                                pattern: new RegExp(`^(https://(www\\.)?${field.host}(/\\S*)?)?$`),
                                                message: `Liên kết ${field.label} không hợp lệ (cần https://…)`,
                                            },
                                        ]}
                                    />
                                </Col>
                            ))}
                            <Col span={24}>
                                <Form.Item labelCol={{ span: 24 }} label="Ảnh bìa (banner, không bắt buộc)">
                                    <ConfigProvider locale={viVN}>
                                        <Upload
                                            name="banner"
                                            listType="picture-card"
                                            maxCount={1}
                                            multiple={false}
                                            customRequest={handleUploadBanner}
                                            beforeUpload={beforeUpload}
                                            onRemove={() => setBanner('')}
                                            onPreview={handlePreview}
                                            defaultFileList={
                                                dataInit?.id && dataInit.banner
                                                    ? [
                                                          {
                                                              uid: uuidv4(),
                                                              name: dataInit.banner,
                                                              status: 'done',
                                                              url: `${import.meta.env.VITE_BACKEND_URL}/storage/company/${dataInit.banner}`,
                                                          },
                                                      ]
                                                    : []
                                            }
                                        >
                                            <div>
                                                {loadingBanner ? <LoadingOutlined /> : <PlusOutlined />}
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        </Upload>
                                    </ConfigProvider>
                                </Form.Item>
                            </Col>

                            <ProCard
                                title="Miêu tả"
                                // subTitle="mô tả công ty"
                                headStyle={{ color: '#d81921' }}
                                style={{ marginBottom: 20 }}
                                headerBordered
                                size="small"
                                bordered
                            >
                                <Col span={24}>
                                    <ReactQuill theme="snow" value={value} onChange={setValue} />
                                </Col>
                            </ProCard>
                        </Row>
                    </ModalForm>
                    <Modal
                        open={previewOpen}
                        title={previewTitle}
                        footer={null}
                        onCancel={() => setPreviewOpen(false)}
                        style={{ zIndex: 1500 }}
                    >
                        <img alt="example" style={{ width: '100%' }} src={previewImage} />
                    </Modal>
                    {dataInit?.id && (
                        <CvViewerModal
                            open={viewLicense}
                            endpoint={`/api/v1/companies/${dataInit.id}/license`}
                            name="Giấy phép kinh doanh"
                            onClose={() => setViewLicense(false)}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default ModalCompany;
