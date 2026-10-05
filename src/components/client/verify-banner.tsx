import { useState } from 'react';
import { Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { callResendVerification } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { errorText } from './auth';
import styles from '@/styles/client.module.scss';

const VerifyBanner = () => {
    const { isAuthenticated, user } = useAppSelector(state => state.account);
    const [busy, setBusy] = useState(false);
    if (!isAuthenticated || user.emailVerified) return null;

    const resend = async () => {
        setBusy(true);
        try {
            const res = await callResendVerification();
            if (+(res?.statusCode ?? 0) === 200) message.success(`Đã gửi email xác thực tới ${user.email}.`);
            else message.warning(errorText(res, 'Chưa gửi được email. Vui lòng thử lại.'));
        } catch {
            message.error('Không thể kết nối. Vui lòng thử lại.');
        }
        setBusy(false);
    };

    return (
        <div className={styles.verifyBanner} role="status">
            <MailOutlined aria-hidden="true" />
            <span>
                Hãy xác thực email <strong>{user.email}</strong> để ứng tuyển và nhận việc làm qua email.
            </span>
            <Button size="small" onClick={resend} loading={busy}>
                Gửi lại email
            </Button>
        </div>
    );
};

export default VerifyBanner;
