import styles from '@/styles/app.module.scss';

// Full-page spinner: Suspense fallback and auth checks.
const Loading = () => <div className={styles.loading} role="status" aria-label="Đang tải" />;

export default Loading;
