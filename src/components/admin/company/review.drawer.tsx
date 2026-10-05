import { useEffect, useState } from 'react';
import { Button, Drawer, Progress, Skeleton, Space, Tag, Tooltip, message, notification } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, FileSearchOutlined } from '@ant-design/icons';
import { callApproveCompany, callFetchCompanyVerification } from '@/config/api';
import CvViewerModal from '@/components/client/cv-viewer';
import { ICompany, ICompanyVerification } from '@/types/backend';
import s from '@/styles/admin.module.scss';

interface IProps {
    company: ICompany | null;
    onClose: () => void;
    onApproved: () => void;
    onReject: (company: ICompany) => void;
}

const CompanyReviewDrawer = ({ company, onClose, onApproved, onReject }: IProps) => {
    const [data, setData] = useState<ICompanyVerification | null>(null);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [viewLicense, setViewLicense] = useState(false);

    useEffect(() => {
        setData(null);
        setFailed(false);
        if (!company?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await callFetchCompanyVerification(company.id!);
                if (!cancelled) {
                    if (res.data) setData(res.data);
                    else setFailed(true);
                }
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [company?.id]);

    const missing = data?.checks.filter(check => check.required && !check.ok) ?? [];

    const approve = async () => {
        if (!company?.id) return;
        setBusy(true);
        try {
            const res = await callApproveCompany(company.id);
            if (res?.data) {
                message.success('Đã duyệt công ty');
                onApproved();
                onClose();
            } else {
                notification.error({ message: 'Chưa thể duyệt', description: res?.message });
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Drawer
            open={Boolean(company)}
            onClose={onClose}
            width={460}
            title={company ? `Xét duyệt: ${company.name}` : ''}
            destroyOnClose
            footer={
                <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                    <Button
                        danger
                        onClick={() => {
                            if (company) onReject(company);
                            onClose();
                        }}
                    >
                        Từ chối
                    </Button>
                    <Tooltip title={missing.length ? `Còn thiếu: ${missing.map(check => check.label).join('; ')}` : ''}>
                        <Button type="primary" loading={busy} disabled={!data || missing.length > 0} onClick={approve}>
                            Duyệt công ty
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            {!data && !failed && <Skeleton active paragraph={{ rows: 8 }} />}
            {failed && <p>Chưa tải được thông tin xác minh. Vui lòng đóng và mở lại.</p>}
            {data && (
                <>
                    <Progress
                        percent={Math.round((data.score / data.checks.length) * 100)}
                        format={() => `${data.score}/${data.checks.length}`}
                        status={missing.length ? 'exception' : 'success'}
                    />
                    <ul className={s.checklist}>
                        {data.checks.map(check => (
                            <li key={check.key}>
                                {check.ok ? (
                                    <CheckCircleFilled style={{ color: '#2b8a3e' }} aria-label="Đạt" />
                                ) : check.required ? (
                                    <CloseCircleFilled style={{ color: '#c0392b' }} aria-label="Chưa đạt" />
                                ) : (
                                    <ExclamationCircleFilled style={{ color: '#d9480f' }} aria-label="Cần lưu ý" />
                                )}
                                <div>
                                    <span>
                                        <strong>{check.label}</strong>
                                        {check.required && <Tag style={{ marginLeft: 8 }}>Bắt buộc</Tag>}
                                    </span>
                                    {check.note && <small>{check.note}</small>}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <dl className={s.facts}>
                        <dt>Mã số thuế</dt>
                        <dd>{data.taxCode || 'Chưa có'}</dd>
                        <dt>Số điện thoại</dt>
                        <dd>{data.phone || 'Chưa có'}</dd>
                        <dt>Website</dt>
                        <dd>
                            {data.website ? (
                                <a href={data.website} target="_blank" rel="noopener noreferrer nofollow">
                                    {data.website}
                                </a>
                            ) : (
                                'Chưa có'
                            )}
                        </dd>
                    </dl>
                    <h4 className={s.drawerHeading}>Tài khoản nhà tuyển dụng</h4>
                    {data.contacts.length === 0 && <p>Công ty chưa có tài khoản nhà tuyển dụng.</p>}
                    {data.contacts.map(contact => (
                        <div key={contact.email} className={s.contact}>
                            <strong>{contact.name}</strong>
                            <span>{contact.email}</span>
                            <span>
                                <Tag color={contact.emailVerified ? 'green' : 'default'}>
                                    {contact.emailVerified ? 'Đã xác thực email' : 'Chưa xác thực email'}
                                </Tag>
                                {contact.freeMail && <Tag color="orange">Email miễn phí</Tag>}
                                {contact.domainMatch === true && <Tag color="green">Cùng tên miền website</Tag>}
                                {contact.domainMatch === false && <Tag>Khác tên miền website</Tag>}
                            </span>
                        </div>
                    ))}
                    <Button
                        icon={<FileSearchOutlined />}
                        style={{ marginTop: 16 }}
                        disabled={!data.hasLicense}
                        onClick={() => setViewLicense(true)}
                    >
                        {data.hasLicense ? 'Xem giấy phép kinh doanh' : 'Chưa có giấy phép'}
                    </Button>
                </>
            )}
            {company?.id && (
                <CvViewerModal
                    open={viewLicense}
                    endpoint={`/api/v1/companies/${company.id}/license`}
                    name="Giấy phép kinh doanh"
                    onClose={() => setViewLicense(false)}
                />
            )}
        </Drawer>
    );
};

export default CompanyReviewDrawer;
