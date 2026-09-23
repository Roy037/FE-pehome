// import { useLocation, useNavigate } from "react-router-dom";
// import { useState, useEffect } from 'react';
// import { IJob } from "@/types/backend";
// import { callFetchJobById } from "@/config/api";
// import styles from 'styles/client.module.scss';
// import parse from 'html-react-parser';
// import { Col, Divider, Row, Skeleton, Tag } from "antd";
// import { DollarOutlined, EnvironmentOutlined, HistoryOutlined } from "@ant-design/icons";
// import { getLocationName } from "@/config/utils";
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import ApplyModal from "@/components/client/modal/apply.modal";
// dayjs.extend(relativeTime)


// const ClientJobDetailPage = (props: any) => {
//     const [jobDetail, setJobDetail] = useState<IJob | null>(null);
//     const [isLoading, setIsLoading] = useState<boolean>(false);

//     const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

//     let location = useLocation();
//     let params = new URLSearchParams(location.search);
//     const id = params?.get("id"); // job id

//     useEffect(() => {
//         const init = async () => {
//             if (id) {
//                 setIsLoading(true)
//                 const res = await callFetchJobById(id);
//                 if (res?.data) {
//                     setJobDetail(res.data)
//                 }
//                 setIsLoading(false)
//             }
//         }
//         init();
//     }, [id]);

//     return (
//         <div className={`${styles["container"]} ${styles["detail-job-section"]}`}>
//             {isLoading ?
//                 <Skeleton />
//                 :
//                 <Row gutter={[20, 20]}>
//                     {jobDetail && jobDetail.id &&
//                         <>
//                             <Col span={24} md={16}>
//                                 <div className={styles["header"]}>
//                                     {jobDetail.name}
//                                 </div>
//                                 <div>
//                                     <button
//                                         onClick={() => setIsModalOpen(true)}
//                                         className={styles["btn-apply"]}
//                                     >Apply Now</button>
//                                 </div>
//                                 <Divider />
//                                 <div className={styles["skills"]}>
//                                     {jobDetail?.skills?.map((item, index) => {
//                                         return (
//                                             <Tag key={`${index}-key`} color="gold" >
//                                                 {item.name}
//                                             </Tag>
//                                         )
//                                     })}
//                                 </div>
//                                 <div className={styles["salary"]}>
//                                     <DollarOutlined />
//                                     <span>&nbsp;{(jobDetail.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ</span>
//                                 </div>
//                                 <div className={styles["location"]}>
//                                     <EnvironmentOutlined style={{ color: '#58aaab' }} />&nbsp;{getLocationName(jobDetail.location)}
//                                 </div>
//                                 <div>
//                                     <HistoryOutlined /> {jobDetail.updatedAt ? dayjs(jobDetail.updatedAt).locale("en").fromNow() : dayjs(jobDetail.createdAt).locale("en").fromNow()}
//                                 </div>
//                                 <Divider />
//                                 {parse(jobDetail.description)}
//                             </Col>

//                             <Col span={24} md={8}>
//                                 <div className={styles["company"]}>
//                                     <div>
//                                         <img
//                                             width={"200px"}
//                                             alt="example"
//                                             src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${jobDetail.company?.logo}`}
//                                         />
//                                     </div>
//                                     <div>
//                                         {jobDetail.company?.name}
//                                     </div>
//                                 </div>
//                             </Col>
//                         </>
//                     }
//                 </Row>
//             }
//             <ApplyModal
//                 isModalOpen={isModalOpen}
//                 setIsModalOpen={setIsModalOpen}
//                 jobDetail={jobDetail}
//             />
//         </div>
//     )
// }
// export default ClientJobDetailPage;
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { IJob } from "@/types/backend";
import { callFetchJobById } from "@/config/api";
import styles from 'styles/client.module.scss';
import parse from 'html-react-parser';
import { Col, Divider, Row, Skeleton, Tag } from "antd";
import { DollarOutlined, EnvironmentOutlined, HistoryOutlined } from "@ant-design/icons";
import { getLocationName } from "@/config/utils";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ApplyModal from "@/components/client/modal/apply.modal";
dayjs.extend(relativeTime);

const ClientJobDetailPage = (props: any) => {
    const [jobDetail, setJobDetail] = useState<IJob | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id"); // job id

    useEffect(() => {
        const init = async () => {
            if (id) {
                setIsLoading(true);
                const res = await callFetchJobById(id);
                if (res?.data) {
                    setJobDetail(res.data);
                }
                setIsLoading(false);
            }
        }
        init();
    }, [id]);

    return (
        <div className={`${styles["container"]} ${styles["detail-job-section"]}`}>
            {isLoading ?
                <Skeleton />
                :
                <Row gutter={[20, 20]}>
                    {jobDetail && jobDetail.id &&
                        <>
                            <Col span={24} md={16}>
                                {/* Tên sản phẩm / Xe */}
                                <div className={styles["header"]}>
                                    {jobDetail.name}
                                </div>

                                {/* Nút bấm Đặt xe */}
                                <div>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className={styles["btn-apply"]}
                                    >
                                        Đặt Xe Ngay
                                    </button>
                                </div>
                                <Divider />

                                {/* Danh sách Option / Tính năng nổi bật */}
                                <div className={styles["skills"]}>
                                    {jobDetail?.skills?.map((item, index) => {
                                        return (
                                            <Tag key={`${index}-key`} color="gold" >
                                                {item.name}
                                            </Tag>
                                        )
                                    })}
                                </div>

                                {/* Giá bán */}
                                <div className={styles["salary"]}>
                                    <DollarOutlined />
                                    <span>&nbsp;Giá niêm yết: {(jobDetail.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ</span>
                                </div>

                                {/* Khu vực / Showroom */}
                                <div className={styles["location"]}>
                                    <EnvironmentOutlined style={{ color: '#58aaab' }} />
                                    &nbsp;Khu vực: {getLocationName(jobDetail.location)}
                                </div>

                                {/* Thời gian cập nhật thông tin */}
                                <div>
                                    <HistoryOutlined /> Cập nhật: {jobDetail.updatedAt ? dayjs(jobDetail.updatedAt).locale("en").fromNow() : dayjs(jobDetail.createdAt).locale("en").fromNow()}
                                </div>
                                <Divider />

                                {/* Mô tả chi tiết sản phẩm / Xe */}
                                {parse(jobDetail.description)}
                            </Col>

                            {/* Khung bên phải: Thông tin Hãng xe / Đại lý */}
                            <Col span={24} md={8}>
                                <div className={styles["company"]}>
                                    <div>
                                        <img
                                            width={"200px"}
                                            alt="Logo Thương Hiệu"
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${jobDetail.company?.logo}`}
                                        />
                                    </div>
                                    <div style={{ marginTop: 10, fontWeight: 'bold' }}>
                                        Đại lý / Thương hiệu: {jobDetail.company?.name}
                                    </div>
                                </div>
                            </Col>
                        </>
                    }
                </Row>
            }
            <ApplyModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                jobDetail={jobDetail}
            />
        </div>
    )
}

export default ClientJobDetailPage;