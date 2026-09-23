// import { useAppSelector } from "@/redux/hooks";
// import { IJob } from "@/types/backend";
// import { ProForm, ProFormText } from "@ant-design/pro-components";
// import { Button, Col, ConfigProvider, Divider, Modal, Row, Upload, message, notification } from "antd";
// import { useNavigate } from "react-router-dom";
// import enUS from 'antd/lib/locale/en_US';
// import { UploadOutlined } from '@ant-design/icons';
// import type { UploadProps } from 'antd';
// import { callCreateResume, callUploadSingleFile } from "@/config/api";
// import { useState } from 'react';

// interface IProps {
//     isModalOpen: boolean;
//     setIsModalOpen: (v: boolean) => void;
//     jobDetail: IJob | null;
// }

// const ApplyModal = (props: IProps) => {
//     const { isModalOpen, setIsModalOpen, jobDetail } = props;
//     const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
//     const user = useAppSelector(state => state.account.user);
//     const [urlCV, setUrlCV] = useState<string>("");

//     const navigate = useNavigate();

//     const handleOkButton = async () => {
//         if (!urlCV && isAuthenticated) {
//             message.error("Vui lòng upload CV!");
//             return;
//         }

//         if (!isAuthenticated) {
//             setIsModalOpen(false);
//             navigate(`/login?callback=${window.location.href}`)
//         }
//         else {
//             //todo
//             if (jobDetail) {
//                 const res = await callCreateResume(urlCV, jobDetail?.id, user.email, user.id);
//                 if (res.data) {
//                     message.success("Rải CV thành công!");
//                     setIsModalOpen(false);
//                 } else {
//                     notification.error({
//                         message: 'Có lỗi xảy ra',
//                         description: res.message
//                     });
//                 }
//             }
//         }
//     }

//     const propsUpload: UploadProps = {
//         maxCount: 1,
//         multiple: false,
//         accept: "application/pdf,application/msword, .doc, .docx, .pdf",
//         async customRequest({ file, onSuccess, onError }: any) {
//             const res = await callUploadSingleFile(file, "resume");
//             if (res && res.data) {
//                 setUrlCV(res.data.fileName);
//                 if (onSuccess) onSuccess('ok')
//             } else {
//                 if (onError) {
//                     setUrlCV("");
//                     const error = new Error(res.message);
//                     onError({ event: error });
//                 }
//             }
//         },
//         onChange(info) {
//             if (info.file.status !== 'uploading') {
//                 // console.log(info.file, info.fileList);
//             }
//             if (info.file.status === 'done') {
//                 message.success(`${info.file.name} file uploaded successfully`);
//             } else if (info.file.status === 'error') {
//                 message.error(info?.file?.error?.event?.message ?? "Đã có lỗi xảy ra khi upload file.")
//             }
//         },
//     };


//     return (
//         <>
//             <Modal title="Ứng Tuyển Job"
//                 open={isModalOpen}
//                 onOk={() => handleOkButton()}
//                 onCancel={() => setIsModalOpen(false)}
//                 maskClosable={false}
//                 okText={isAuthenticated ? "Rải CV Nào " : "Đăng Nhập Nhanh"}
//                 cancelButtonProps={
//                     { style: { display: "none" } }
//                 }
//                 destroyOnClose={true}
//             >
//                 <Divider />
//                 {isAuthenticated ?
//                     <div>
//                         <ConfigProvider locale={enUS}>
//                             <ProForm
//                                 submitter={{
//                                     render: () => <></>
//                                 }}
//                             >
//                                 <Row gutter={[10, 10]}>
//                                     <Col span={24}>
//                                         <div>
//                                             Bạn đang ứng tuyển công việc <b>{jobDetail?.name} </b>tại  <b>{jobDetail?.company?.name}</b>
//                                         </div>
//                                     </Col>
//                                     <Col span={24}>
//                                         <ProFormText
//                                             fieldProps={{
//                                                 type: "email"
//                                             }}
//                                             label="Email"
//                                             name={"email"}
//                                             labelAlign="right"
//                                             disabled
//                                             initialValue={user?.email}
//                                         />
//                                     </Col>
//                                     <Col span={24}>
//                                         <ProForm.Item
//                                             label={"Upload file CV"}
//                                             rules={[{ required: true, message: 'Vui lòng upload file!' }]}
//                                         >

//                                             <Upload {...propsUpload}>
//                                                 <Button icon={<UploadOutlined />}>Tải lên CV của bạn ( Hỗ trợ *.doc, *.docx, *.pdf, and &lt; 5MB )</Button>
//                                             </Upload>
//                                         </ProForm.Item>
//                                     </Col>
//                                 </Row>

//                             </ProForm>
//                         </ConfigProvider>
//                     </div>
//                     :
//                     <div>
//                         Bạn chưa đăng nhập hệ thống. Vui lòng đăng nhập để có thể "Rải CV" bạn nhé -.-
//                     </div>
//                 }
//                 <Divider />
//             </Modal>
//         </>
//     )
// }
// export default ApplyModal;
import { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { ProForm, ProFormText } from "@ant-design/pro-components";
import { Button, Col, ConfigProvider, Divider, Modal, Row, Upload, message, notification } from "antd";
import { useNavigate } from "react-router-dom";
import enUS from 'antd/lib/locale/en_US';
import type { UploadProps } from 'antd';
import { callCreateResume, callUploadSingleFile } from "@/config/api";
import { useAppSelector } from "@/redux/hooks";
import { IJob } from "@/types/backend";

interface IProps {
    isModalOpen: boolean;
    setIsModalOpen: (v: boolean) => void;
    jobDetail: IJob | null;
}

const ApplyModal = (props: IProps) => {
    const { isModalOpen, setIsModalOpen, jobDetail } = props;
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);

    const [urlCV, setUrlCV] = useState<string>("");
    const [fullName, setFullName] = useState<string>("");
    const [phone, setPhone] = useState<string>("");

    const navigate = useNavigate();

    const handleOkButton = async () => {
        if (!fullName || !phone) {
            message.error("Vui lòng nhập đầy đủ Tên và Số điện thoại nhận hàng!");
            return;
        }

        if (!urlCV && isAuthenticated) {
            message.error("Vui lòng tải lên chứng từ / hóa đơn thanh toán!");
            return;
        }

        if (!isAuthenticated) {
            setIsModalOpen(false);
            navigate(`/login?callback=${window.location.href}`);
        }
        else {
            if (jobDetail) {
                // Tùy chọn: Nếu BE có hỗ trợ truyền fullName, phone thì truyền vào
                // Hiện tại giữ nguyên API cũ để không gãy hệ thống
                const res = await callCreateResume(urlCV, jobDetail?.id, user.email, user.id);
                if (res.data) {
                    message.success("Đặt hàng & Gửi thông tin thanh toán thành công!");
                    setIsModalOpen(false);
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: res.message
                    });
                }
            }
        }
    }

    const propsUpload: UploadProps = {
        maxCount: 1,
        multiple: false,
        accept: "application/pdf,application/msword, .doc, .docx, .pdf, .png, .jpg",
        async customRequest({ file, onSuccess, onError }: any) {
            const res = await callUploadSingleFile(file, "resume");
            if (res && res.data) {
                setUrlCV(res.data.fileName);
                if (onSuccess) onSuccess('ok');
            } else {
                if (onError) {
                    setUrlCV("");
                    const error = new Error(res.message);
                    onError({ event: error });
                }
            }
        },
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} đã được tải lên thành công`);
            } else if (info.file.status === 'error') {
                message.error(info?.file?.error?.event?.message ?? "Đã có lỗi xảy ra khi upload file.");
            }
        },
    };

    return (
        <>
            <Modal title="Xác Nhận Đặt Hàng & Thanh Toán"
                open={isModalOpen}
                onOk={() => handleOkButton()}
                onCancel={() => setIsModalOpen(false)}
                maskClosable={false}
                okText={isAuthenticated ? "Xác Nhận Đặt Hàng" : "Đăng Nhập Để Mua Hàng"}
                cancelButtonProps={
                    { style: { display: "none" } }
                }
                destroyOnClose={true}
            >
                <Divider />
                {isAuthenticated ?
                    <div>
                        <ConfigProvider locale={enUS}>
                            <ProForm
                                submitter={{
                                    render: () => <></>
                                }}
                            >
                                <Row gutter={[10, 10]}>
                                    <Col span={24}>
                                        <div>
                                            Bạn đang tiến hành đặt mua xe <b>{jobDetail?.name}</b> thuộc đại lý <b>{jobDetail?.company?.name}</b>
                                        </div>
                                    </Col>

                                    {/* Thêm Họ tên người nhận */}
                                    <Col span={12}>
                                        <ProFormText
                                            label="Họ và tên người nhận"
                                            name={"fullName"}
                                            placeholder="Nhập họ tên"
                                            initialValue={user?.name}
                                            fieldProps={{
                                                onChange: (e) => setFullName(e.target.value)
                                            }}
                                            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                                        />
                                    </Col>

                                    {/* Thêm Số điện thoại */}
                                    <Col span={12}>
                                        <ProFormText
                                            label="Số điện thoại"
                                            name={"phone"}
                                            placeholder="Nhập số điện thoại"
                                            fieldProps={{
                                                onChange: (e) => setPhone(e.target.value)
                                            }}
                                            rules={[{ required: true, message: 'Vui lòng không bỏ trống!' }]}
                                        />
                                    </Col>

                                    <Col span={24}>
                                        <ProFormText
                                            fieldProps={{
                                                type: "email"
                                            }}
                                            label="Email người mua"
                                            name={"email"}
                                            labelAlign="right"
                                            disabled
                                            initialValue={user?.email}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ProForm.Item
                                            label={"Chứng từ / Hóa đơn thanh toán (Ủy nhiệm chi)"}
                                            rules={[{ required: true, message: 'Vui lòng upload chứng từ thanh toán!' }]}
                                        >
                                            <Upload {...propsUpload}>
                                                <Button icon={<UploadOutlined />}>
                                                    Tải lên ảnh/file hóa đơn cọc (Hỗ trợ *.pdf, *.png, *.doc &lt; 5MB)
                                                </Button>
                                            </Upload>
                                        </ProForm.Item>
                                    </Col>
                                </Row>
                            </ProForm>
                        </ConfigProvider>
                    </div>
                    :
                    <div>
                        Bạn chưa đăng nhập hệ thống. Vui lòng đăng nhập để tiến hành đặt hàng bạn nhé!
                    </div>
                }
                <Divider />
            </Modal>
        </>
    );
}

export default ApplyModal;