import { message } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useAuthModal } from '@/components/client/auth';
import { useAppDispatch, useAppSelector, useIsEmployer } from '@/redux/hooks';
import { toggleFollowedCompany } from '@/redux/slice/followedCompanySlide';
import styles from '@/styles/client.module.scss';

interface IProps {
    companyId?: string | number;
    companyName: string;
    className?: string;
    withLabel?: boolean;
}

const FollowCompanyButton = ({ companyId, companyName, className, withLabel }: IProps) => {
    const dispatch = useAppDispatch();
    const isEmployer = useIsEmployer();
    const openAuth = useAuthModal();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const id = String(companyId);
    const followed = useAppSelector(state => state.followedCompany.ids.includes(id));

    const toggle = async () => {
        if (!isAuthenticated) {
            openAuth('login');
            return;
        }
        try {
            await dispatch(toggleFollowedCompany({ id, followed })).unwrap();
            message.success(followed ? 'Đã bỏ theo dõi công ty.' : 'Đã theo dõi công ty.');
        } catch {
            message.error('Chưa thể cập nhật công ty đang theo dõi. Vui lòng thử lại.');
        }
    };

    if (isEmployer) return null;

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={followed}
            aria-label={followed ? `Bỏ theo dõi công ty ${companyName}` : `Theo dõi công ty ${companyName}`}
            className={`${styles.saveButton} ${withLabel ? styles.saveButtonLabel : ''} ${className ?? ''}`}
        >
            {followed ? <HeartFilled aria-hidden="true" /> : <HeartOutlined aria-hidden="true" />}
            {withLabel && <span>{followed ? 'Đang theo dõi' : 'Theo dõi'}</span>}
        </button>
    );
};

export default FollowCompanyButton;
