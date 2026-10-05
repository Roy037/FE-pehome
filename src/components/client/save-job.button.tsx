import { message } from 'antd';
import { BookmarkSimple as PiBookmarkSimple } from '@phosphor-icons/react';
import { useAuthModal } from '@/components/client/auth';
import { useAppDispatch, useAppSelector, useIsEmployer } from '@/redux/hooks';
import { toggleSavedJob } from '@/redux/slice/savedJobSlide';
import { useUpgradeModal } from '@/components/client/modal/upgrade.modal';
import styles from '@/styles/client.module.scss';

interface IProps {
    jobId?: string | number;
    jobName: string;
    className?: string;
    withLabel?: boolean;
}

const SaveJobButton = ({ jobId, jobName, className, withLabel }: IProps) => {
    const dispatch = useAppDispatch();
    const isEmployer = useIsEmployer();
    const openUpgrade = useUpgradeModal();
    const openAuth = useAuthModal();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const id = String(jobId);
    const saved = useAppSelector(state => state.savedJob.ids.includes(id));

    const toggle = async () => {
        if (!isAuthenticated) {
            openAuth('login');
            return;
        }
        try {
            await dispatch(toggleSavedJob({ id, saved })).unwrap();
            message.success(saved ? 'Đã bỏ lưu việc làm.' : 'Đã lưu việc làm.');
        } catch (error) {
            const reason = (error as { message?: string })?.message ?? '';
            if (reason.startsWith('Gói ')) {
                openUpgrade();
            } else {
                message.error('Chưa thể cập nhật việc làm đã lưu. Vui lòng thử lại.');
            }
        }
    };

    if (isEmployer) return null;

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={saved}
            aria-label={saved ? `Bỏ lưu việc làm ${jobName}` : `Lưu việc làm ${jobName}`}
            className={`${styles.saveButton} ${withLabel ? styles.saveButtonLabel : ''} ${className ?? ''}`}
        >
            {saved ? (
                <PiBookmarkSimple weight="fill" aria-hidden="true" />
            ) : (
                <PiBookmarkSimple weight="bold" aria-hidden="true" />
            )}
            {withLabel && <span>{saved ? 'Đã lưu' : 'Lưu tin'}</span>}
        </button>
    );
};

export default SaveJobButton;
