import { ReactNode, useEffect, useState } from 'react';
import { Drawer, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { BookmarkSimple as PiBookmarkSimple, Briefcase as PiBriefcase, Plus as PiPlus } from '@phosphor-icons/react';
import {
    DownOutlined,
    FileSearchOutlined,
    LogoutOutlined,
    MenuOutlined,
    SettingOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthLink, useAuthModal } from '@/components/client/auth';
import { companyPath } from '@/config/utils';
import UserAvatar from '@/components/client/avatar';
import { useAppDispatch, useAppSelector, useIsVip } from '@/redux/hooks';
import { VipFrame } from '@/components/client/vip';
import ChangePasswordModal from './modal/change-password';
import ChangeAvatarModal from './modal/change-avatar';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { useAccountModal } from './modal/manage.account';
import { useUpgradeModal } from './modal/upgrade.modal';
import { Brand } from './decor';
import styles from '@/styles/client.module.scss';

const links = [
    { to: '/', label: 'Trang chủ', end: true },
    { to: '/job', label: 'Việc làm' },
    { to: '/company', label: 'Công ty' },
];

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();
    const openAccount = useAccountModal();
    const openUpgrade = useUpgradeModal();
    const isVip = useIsVip();
    const openAuth = useAuthModal();
    const { isAuthenticated, user } = useAppSelector(state => state.account);
    const savedCount = useAppSelector(state => state.savedJob.ids.length);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const plan = useAppSelector(state => state.plan.plan);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, location.hash]);

    const handleLogout = async () => {
        try {
            const response = await callLogout();
            if (+response.statusCode !== 200) throw new Error();
            dispatch(setLogoutAction({}));
            message.success('Bạn đã đăng xuất.');
            navigate('/');
        } catch {
            message.error('Chưa thể đăng xuất. Vui lòng thử lại.');
        }
    };

    const isEmployer = Boolean(user.company);
    const canManage = Boolean(user.role?.permissions?.length);
    const planName = plan ? plan[0] + plan.slice(1).toLowerCase() : null;
    const roleLabel = isEmployer
        ? user.company!.name
        : user.role?.name === 'SUPER_ADMIN'
          ? 'Quản trị viên'
          : 'Ứng viên';
    const closeAccount = () => setAccountOpen(false);

    const accountCard = (
        <div className={styles.accountCard}>
            <div className={styles.accountWho}>
                <VipFrame vip={isVip}>
                    <UserAvatar name={user.name} avatar={user.avatar} className={styles.accountAvatar} />
                </VipFrame>
                <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <small>
                        {roleLabel}
                        {planName && <em> · Gói {planName}</em>}
                    </small>
                </div>
            </div>
            <div className={styles.accountActions}>
                {isEmployer ? (
                    user.company?.approved && (
                        <Link to={companyPath(user.company)} className={styles.accountGhost} onClick={closeAccount}>
                            Trang công ty
                        </Link>
                    )
                ) : (
                    <>
                        <Link to="/ho-so" className={styles.accountGhost} onClick={closeAccount}>
                            Xem hồ sơ
                        </Link>
                        {!isVip && (
                            <button
                                type="button"
                                className={styles.accountSolid}
                                onClick={() => {
                                    closeAccount();
                                    openUpgrade();
                                }}
                            >
                                Nâng cấp
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const groupTitle = (icon: ReactNode, text: string) => (
        <span className={styles.accountGroup}>
            {icon}
            {text}
        </span>
    );
    const passwordItem = {
        key: 'password',
        label: 'Đổi mật khẩu',
        onClick: () => {
            closeAccount();
            setPasswordOpen(true);
        },
    };
    const accountItems: MenuProps['items'] = [
        ...(isEmployer
            ? [
                  {
                      type: 'group' as const,
                      label: groupTitle(<UserOutlined />, 'Tài khoản'),
                      children: [
                          {
                              key: 'avatar',
                              label: 'Ảnh đại diện',
                              onClick: () => {
                                  closeAccount();
                                  setAvatarOpen(true);
                              },
                          },
                          passwordItem,
                      ],
                  },
              ]
            : [
                  {
                      type: 'group' as const,
                      label: groupTitle(<FileSearchOutlined />, 'Tìm việc'),
                      children: [
                          {
                              key: 'applications',
                              label: 'Việc làm đã ứng tuyển',
                              onClick: () => openAccount('user-resume'),
                          },
                          {
                              key: 'saved',
                              label: 'Việc làm đã lưu',
                              onClick: () => openAccount('saved-jobs'),
                          },
                          {
                              key: 'followed',
                              label: 'Công ty đang theo dõi',
                              onClick: () => openAccount('followed-companies'),
                          },
                      ],
                  },
                  {
                      type: 'group' as const,
                      label: groupTitle(<UserOutlined />, 'Tài khoản'),
                      children: [
                          {
                              key: 'plan',
                              label: isVip ? `Gói ${planName} của tôi` : 'Gói của tôi',
                              onClick: () => openAccount('my-plan'),
                          },
                          {
                              key: 'alerts',
                              label: 'Nhận việc làm qua email',
                              onClick: () => openAccount('email-by-skills'),
                          },
                          passwordItem,
                      ],
                  },
              ]),
        ...(canManage
            ? [
                  {
                      type: 'group' as const,
                      label: groupTitle(<SettingOutlined />, 'Quản lý'),
                      children: [
                          {
                              key: 'admin',
                              label: <Link to="/admin">{isEmployer ? 'Quản lý tuyển dụng' : 'Trang quản trị'}</Link>,
                          },
                      ],
                  },
              ]
            : []),
        { type: 'divider' as const },
        {
            key: 'logout',
            label: groupTitle(<LogoutOutlined />, 'Đăng xuất'),
            className: styles.accountLogout,
            onClick: handleLogout,
        },
    ];

    const employerItems = [
        {
            key: 'post',
            icon: <PiPlus weight="bold" />,
            onClick: () => openAuth('employer-register'),
            label: (
                <span className={styles.employerMenuItem}>
                    <strong>Đăng tin tuyển dụng</strong>
                    <small>Tạo tài khoản công ty và đăng tin đầu tiên</small>
                </span>
            ),
        },
        {
            key: 'login',
            icon: <UserOutlined />,
            onClick: () => openAuth('employer-login'),
            label: (
                <span className={styles.employerMenuItem}>
                    <strong>Đăng nhập nhà tuyển dụng</strong>
                    <small>Quản lý tin đăng và hồ sơ ứng viên</small>
                </span>
            ),
        },
    ];
    const postJobPath = user.company?.approved ? '/admin/job/upsert' : '/admin';

    const navigation = (
        <>
            {links.map(link => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => (isActive ? styles.navActive : undefined)}
                >
                    {link.label}
                </NavLink>
            ))}
        </>
    );

    return (
        <>
            <a className={styles.skipLink} href="#main-content">
                Chuyển đến nội dung
            </a>
            <header className={styles.siteHeader}>
                <div className={`${styles.container} ${styles.headerInner}`}>
                    <Brand />
                    <nav className={styles.desktopNav} aria-label="Điều hướng chính">
                        {navigation}
                    </nav>
                    <div className={styles.headerActions}>
                        {isAuthenticated ? (
                            <>
                                {!isEmployer && (
                                    <button
                                        type="button"
                                        className={styles.iconButton}
                                        onClick={() => openAccount('saved-jobs')}
                                        aria-label={`Việc làm đã lưu (${savedCount})`}
                                    >
                                        <PiBookmarkSimple weight="bold" aria-hidden="true" />
                                        {savedCount > 0 && (
                                            <span className={styles.countBadge} aria-hidden="true">
                                                {savedCount > 99 ? '99+' : savedCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                                {user.company && (
                                    <Link to={postJobPath} className={styles.employerButton}>
                                        <PiPlus weight="bold" aria-hidden="true" /> Đăng tin tuyển dụng
                                    </Link>
                                )}
                                <Dropdown
                                    menu={{ items: accountItems }}
                                    trigger={['click']}
                                    placement="bottomRight"
                                    open={accountOpen}
                                    onOpenChange={setAccountOpen}
                                    overlayClassName={styles.accountMenu}
                                    align={{ offset: [14, 22] }}
                                    dropdownRender={menu => (
                                        <div className={styles.accountPanel}>
                                            {accountCard}
                                            {menu}
                                        </div>
                                    )}
                                >
                                    <button
                                        type="button"
                                        className={styles.avatarButton}
                                        aria-label={`Tài khoản của ${user.name}`}
                                    >
                                        <VipFrame vip={isVip}>
                                            <UserAvatar
                                                name={user.name}
                                                avatar={user.avatar}
                                                className={styles.avatar}
                                            />
                                        </VipFrame>
                                        <span className={styles.avatarName}>{user.name}</span>
                                        <DownOutlined aria-hidden="true" />
                                    </button>
                                </Dropdown>
                            </>
                        ) : (
                            <>
                                <AuthLink mode="login" className={styles.loginLink}>
                                    Đăng nhập
                                </AuthLink>
                                <AuthLink mode="register" className={`${styles.btnPrimarySm} ${styles.headerCta}`}>
                                    Đăng ký
                                </AuthLink>
                                <span className={styles.headerDivider} aria-hidden="true" />
                                <Dropdown
                                    menu={{ items: employerItems }}
                                    trigger={['hover', 'click']}
                                    placement="bottomRight"
                                    overlayClassName={styles.employerMenu}
                                >
                                    <button type="button" className={styles.employerButton}>
                                        <PiBriefcase weight="fill" aria-hidden="true" /> Nhà tuyển dụng{' '}
                                        <DownOutlined aria-hidden="true" />
                                    </button>
                                </Dropdown>
                            </>
                        )}
                        <button
                            type="button"
                            className={styles.menuButton}
                            onClick={() => setMobileOpen(true)}
                            aria-label="Mở menu điều hướng"
                            aria-expanded={mobileOpen}
                        >
                            <MenuOutlined />
                        </button>
                    </div>
                </div>
            </header>
            <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
            <ChangeAvatarModal open={avatarOpen} onClose={() => setAvatarOpen(false)} />
            <Drawer title="itjobs" open={mobileOpen} onClose={() => setMobileOpen(false)} width={300}>
                <nav className={styles.mobileNav} aria-label="Điều hướng trên điện thoại">
                    {navigation}
                    {isAuthenticated ? (
                        <>
                            {isEmployer ? (
                                user.company?.approved && (
                                    <Link to={companyPath(user.company)} onClick={() => setMobileOpen(false)}>
                                        Trang công ty của tôi
                                    </Link>
                                )
                            ) : (
                                <>
                                    <Link to="/ho-so" onClick={() => setMobileOpen(false)}>
                                        Hồ sơ của tôi
                                    </Link>
                                    <button type="button" onClick={() => openAccount('user-resume')}>
                                        Hồ sơ & ứng tuyển
                                    </button>
                                    <button type="button" onClick={() => openAccount('followed-companies')}>
                                        Công ty đang theo dõi
                                    </button>
                                    <button type="button" onClick={openUpgrade}>
                                        Nâng cấp Premium
                                    </button>
                                </>
                            )}
                            {user.role?.permissions?.length ? (
                                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                                    {user.company ? 'Quản lý tuyển dụng' : 'Trang quản trị'}
                                </Link>
                            ) : null}
                            {user.company && (
                                <Link
                                    to={postJobPath}
                                    className={styles.mobileEmployerCta}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <PiPlus weight="bold" aria-hidden="true" /> Đăng tin tuyển dụng
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <AuthLink mode="login" onClick={() => setMobileOpen(false)}>
                                Đăng nhập
                            </AuthLink>
                            <AuthLink mode="register" onClick={() => setMobileOpen(false)}>
                                Tạo tài khoản
                            </AuthLink>
                            <div className={styles.mobileEmployer}>
                                <span>
                                    <PiBriefcase weight="fill" aria-hidden="true" /> Dành cho nhà tuyển dụng
                                </span>
                                <AuthLink mode="employer-register" onClick={() => setMobileOpen(false)}>
                                    Đăng tin tuyển dụng
                                </AuthLink>
                                <AuthLink mode="employer-login" onClick={() => setMobileOpen(false)}>
                                    Đăng nhập nhà tuyển dụng
                                </AuthLink>
                            </div>
                        </>
                    )}
                </nav>
            </Drawer>
        </>
    );
};

export default Header;
