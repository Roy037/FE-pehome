import { FormEvent, useState } from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { useAccountModal } from './modal/manage.account';
import { Brand } from './decor';
import { AuthLink, useAuthModal } from './auth';
import styles from '@/styles/client.module.scss';

const JobAlertBand = () => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const openAccount = useAccountModal();
    const openAuth = useAuthModal();
    const [email, setEmail] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (isAuthenticated) openAccount('email-by-skills');
        else openAuth('register', { email: email.trim() });
    };

    return (
        <section className={styles.jobAlert} aria-labelledby="job-alert-title">
            <div className={`${styles.container} ${styles.jobAlertInner}`}>
                <h2 id="job-alert-title">
                    Nhận thông tin việc làm
                    <br />
                    <span className={styles.squiggle}>phù hợp</span> thường xuyên
                </h2>
                <form className={styles.alertForm} onSubmit={submit}>
                    {!isAuthenticated && (
                        <>
                            <label htmlFor="job-alert-email" className="sr-only">
                                Email của bạn
                            </label>
                            <input
                                id="job-alert-email"
                                type="email"
                                required
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                placeholder="Nhập email của bạn…"
                                autoComplete="email"
                            />
                        </>
                    )}
                    {isAuthenticated && (
                        <span className={styles.alertHint}>Chọn kỹ năng để nhận việc làm phù hợp qua email.</span>
                    )}
                    <button type="submit">
                        {isAuthenticated ? 'Chọn kỹ năng' : 'Đăng ký'}
                        <span aria-hidden="true">
                            <ArrowRightOutlined />
                        </span>
                    </button>
                </form>
            </div>
        </section>
    );
};

const Footer = () => {
    const { pathname } = useLocation();
    const openAccount = useAccountModal();
    const user = useAppSelector(state => state.account.user);
    const manages = Boolean(user.company) || Boolean(user.role?.permissions?.length);
    return (
        <>
            {pathname !== '/' && <JobAlertBand />}
            <footer className={styles.siteFooter}>
                <div className={`${styles.container} ${styles.footerGrid}`}>
                    <div className={styles.footerBrand}>
                        <Brand />
                        <p>Tìm việc dễ dàng hơn cùng itjobs — nơi ứng viên và nhà tuyển dụng tìm thấy nhau.</p>
                    </div>
                    <nav aria-labelledby="footer-links">
                        <h3 id="footer-links">Liên kết nhanh</h3>
                        <ul>
                            <li>
                                <Link to="/job">Việc làm</Link>
                            </li>
                            <li>
                                <Link to="/company">Công ty</Link>
                            </li>
                            <li>
                                <Link to="/#faq">Câu hỏi thường gặp</Link>
                            </li>
                        </ul>
                    </nav>
                    <nav aria-labelledby="footer-candidates">
                        <h3 id="footer-candidates">Dành cho ứng viên</h3>
                        <ul>
                            <li>
                                <AuthLink mode="register">Tạo tài khoản</AuthLink>
                            </li>
                            <li>
                                <AuthLink mode="login">Đăng nhập</AuthLink>
                            </li>
                            <li>
                                <button type="button" onClick={() => openAccount('saved-jobs')}>
                                    Việc làm đã lưu
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => openAccount('user-resume')}>
                                    Hồ sơ ứng tuyển
                                </button>
                            </li>
                        </ul>
                    </nav>
                    <nav aria-labelledby="footer-employers">
                        <h3 id="footer-employers">Nhà tuyển dụng</h3>
                        {manages ? (
                            <ul>
                                <li>
                                    <Link to="/admin">{user.company ? 'Quản lý tuyển dụng' : 'Trang quản trị'}</Link>
                                </li>
                                <li>
                                    <Link to="/admin/job/upsert">Đăng tin tuyển dụng</Link>
                                </li>
                                <li>
                                    <Link to="/admin/resume">Quản lý hồ sơ</Link>
                                </li>
                                <li>
                                    <Link to="/dieu-khoan-nha-tuyen-dung">Điều khoản nhà tuyển dụng</Link>
                                </li>
                            </ul>
                        ) : (
                            <ul>
                                <li>
                                    <AuthLink mode="employer-login">Đăng nhập nhà tuyển dụng</AuthLink>
                                </li>
                                <li>
                                    <AuthLink mode="employer-register">Đăng ký nhà tuyển dụng</AuthLink>
                                </li>
                                <li>
                                    <Link to="/dieu-khoan-nha-tuyen-dung">Điều khoản nhà tuyển dụng</Link>
                                </li>
                            </ul>
                        )}
                    </nav>
                </div>
                <div className={`${styles.container} ${styles.footerBottom}`}>
                    <span>© {new Date().getFullYear()} itjobs. Bảo lưu mọi quyền.</span>
                    <span>Cùng bạn trên từng bước của hành trình sự nghiệp.</span>
                </div>
            </footer>
        </>
    );
};

export default Footer;
