import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined,
    ExceptionOutlined,
    ApiOutlined,
    UserOutlined,
    BankOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    AliwangwangOutlined,
    ScheduleOutlined,
    StarOutlined,
    FlagOutlined,
    HeartOutlined,
    MailOutlined,
    ContactsOutlined,
    WalletOutlined,
    HomeOutlined,
    CameraOutlined,
    LockOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, message, Avatar, Button, Alert, Tag, Drawer, Grid, Modal } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { callLogout } from 'config/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { MenuProps } from 'antd';
import { fetchAccount, setLogoutAction } from '@/redux/slice/accountSlide';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { COMPANY_STATUS, companyStatus } from '@/config/utils';
import ProLocale from './pro-locale';
import VerifyBanner from '@/components/client/verify-banner';
import ChangePasswordModal from '@/components/client/modal/change-password';
import { EmployerTermsContent } from '@/components/client/employer-terms';
import { callAcceptTerms, callFetchCompanyVerification } from '@/config/api';
import ChangeAvatarModal from '@/components/client/modal/change-avatar';
import { avatarUrl } from '@/components/client/avatar';

const { Content, Sider } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const narrow = Grid.useBreakpoint().md === false;
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [acceptingTerms, setAcceptingTerms] = useState(false);
    // what an employer still has to provide before the company can be approved
    const [todo, setTodo] = useState<string[]>([]);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');
    const user = useAppSelector(state => state.account.user);
    const company = user.company;

    const permissions = useAppSelector(state => state.account.user.role.permissions);
    const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const ACL_ENABLE = import.meta.env.VITE_ACL_ENABLE;
        if (permissions?.length || ACL_ENABLE === 'false') {
            const viewCompany = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.COMPANIES.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.COMPANIES.GET_PAGINATE.method,
            );

            const viewUser = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.USERS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method,
            );

            const viewJob = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.JOBS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.JOBS.GET_PAGINATE.method,
            );

            const viewResume = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.RESUMES.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.RESUMES.GET_PAGINATE.method,
            );

            const viewRole = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.ROLES.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.ROLES.GET_PAGINATE.method,
            );

            const viewReview = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.REVIEWS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.REVIEWS.GET_PAGINATE.method,
            );

            const viewJobReport = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.JOB_REPORTS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.JOB_REPORTS.GET_PAGINATE.method,
            );

            const viewTalent = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.TALENTS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.TALENTS.GET_PAGINATE.method,
            );

            const viewSavedJob = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.SAVED_JOBS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.SAVED_JOBS.GET_PAGINATE.method,
            );

            const viewSubscriber = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.SUBSCRIBERS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.SUBSCRIBERS.GET_PAGINATE.method,
            );

            const viewOrder = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.ORDERS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.ORDERS.GET_PAGINATE.method,
            );

            const viewPermission = permissions?.find(
                item =>
                    item.apiPath === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.apiPath &&
                    item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method,
            );

            const full = [
                {
                    label: <Link to="/admin">Tổng quan</Link>,
                    key: '/admin',
                    icon: <AppstoreOutlined />,
                },
                ...(viewCompany || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/company">Công ty</Link>,
                              key: '/admin/company',
                              icon: <BankOutlined />,
                          },
                      ]
                    : []),

                ...(viewUser || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/user">Người dùng</Link>,
                              key: '/admin/user',
                              icon: <UserOutlined />,
                          },
                      ]
                    : []),
                ...(viewJob || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/job">Việc làm</Link>,
                              key: '/admin/job',
                              icon: <ScheduleOutlined />,
                          },
                      ]
                    : []),

                ...(viewResume || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/resume">Hồ sơ ứng tuyển</Link>,
                              key: '/admin/resume',
                              icon: <AliwangwangOutlined />,
                          },
                      ]
                    : []),
                ...(viewReview || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/review">Đánh giá</Link>,
                              key: '/admin/review',
                              icon: <StarOutlined />,
                          },
                      ]
                    : []),
                ...(viewJobReport || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/job-report">Báo cáo tin</Link>,
                              key: '/admin/job-report',
                              icon: <FlagOutlined />,
                          },
                      ]
                    : []),
                ...((viewTalent || ACL_ENABLE === 'false') && (!company || company.approved)
                    ? [
                          {
                              label: <Link to="/admin/talent">Kho ứng viên</Link>,
                              key: '/admin/talent',
                              icon: <ContactsOutlined />,
                          },
                      ]
                    : []),
                ...(viewOrder || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/order">Giao dịch</Link>,
                              key: '/admin/order',
                              icon: <WalletOutlined />,
                          },
                      ]
                    : []),
                ...(viewSavedJob || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/saved-job">Việc đã lưu</Link>,
                              key: '/admin/saved-job',
                              icon: <HeartOutlined />,
                          },
                      ]
                    : []),
                ...(viewSubscriber || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/subscriber">Đăng ký nhận tin</Link>,
                              key: '/admin/subscriber',
                              icon: <MailOutlined />,
                          },
                      ]
                    : []),
                ...(viewPermission || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/permission">Quyền hạn</Link>,
                              key: '/admin/permission',
                              icon: <ApiOutlined />,
                          },
                      ]
                    : []),
                ...(viewRole || ACL_ENABLE === 'false'
                    ? [
                          {
                              label: <Link to="/admin/role">Vai trò</Link>,
                              key: '/admin/role',
                              icon: <ExceptionOutlined />,
                          },
                      ]
                    : []),
            ];

            setMenuItems(full);
        }
    }, [permissions]);
    useEffect(() => {
        setActiveMenu(location.pathname);
        setDrawerOpen(false);
    }, [location]);

    const pendingCompanyId = user.company && !user.company.approved ? user.company.id : null;
    useEffect(() => {
        setTodo([]);
        if (!pendingCompanyId) return;
        (async () => {
            try {
                const res = await callFetchCompanyVerification(pendingCompanyId);
                setTodo(res.data?.checks.filter(check => check.required && !check.ok).map(check => check.label) ?? []);
            } catch {
                setTodo([]);
            }
        })();
    }, [pendingCompanyId]);

    const acceptTerms = async () => {
        setAcceptingTerms(true);
        try {
            await callAcceptTerms();
            await dispatch(fetchAccount());
        } catch {
            message.error('Chưa thể lưu lựa chọn của bạn. Vui lòng thử lại.');
        } finally {
            setAcceptingTerms(false);
        }
    };

    const handleLogout = async () => {
        try {
            await callLogout();
        } catch {}
        dispatch(setLogoutAction({}));
        message.success('Đăng xuất thành công');
        navigate('/');
    };

    // if (isMobile) {
    //     items.push({
    //         label: <label
    //             style={{ cursor: 'pointer' }}
    //             onClick={() => handleLogout()}
    //         >Đăng xuất</label>,
    //         key: 'logout',
    //         icon: <LogoutOutlined />
    //     })
    // }

    const itemsDropdown: MenuProps['items'] = [
        { key: 'home', label: <Link to="/">Trang chủ</Link>, icon: <HomeOutlined /> },
        { key: 'avatar', label: 'Ảnh đại diện', icon: <CameraOutlined />, onClick: () => setAvatarOpen(true) },
        { key: 'password', label: 'Đổi mật khẩu', icon: <LockOutlined />, onClick: () => setPasswordOpen(true) },
        { type: 'divider' },
        { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
    ];

    return (
        <ProLocale>
            <Layout style={{ minHeight: '100dvh' }} className="layout-admin">
                {!narrow && (
                    <Sider
                        theme="light"
                        collapsible
                        breakpoint="lg"
                        collapsed={collapsed}
                        onCollapse={value => setCollapsed(value)}
                    >
                        <div style={{ height: 32, margin: 16, textAlign: 'center' }}>
                            <Link to="/" aria-label="itjobs — Trang chủ">
                                <img
                                    src={collapsed ? '/favicon.svg' : '/logos/itjobs.svg'}
                                    alt="itjobs"
                                    width={collapsed ? 28 : 116}
                                    height={38}
                                />
                            </Link>
                        </div>
                        <Menu
                            selectedKeys={[activeMenu]}
                            mode="inline"
                            items={menuItems}
                            onClick={e => setActiveMenu(e.key)}
                        />
                    </Sider>
                )}
                {narrow && (
                    <Drawer
                        placement="left"
                        width={264}
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        title={
                            <Link to="/" aria-label="itjobs — Trang chủ">
                                <img src="/logos/itjobs.svg" alt="itjobs" width={104} height={34} />
                            </Link>
                        }
                        styles={{ body: { padding: 8 } }}
                    >
                        <Menu
                            selectedKeys={[activeMenu]}
                            mode="inline"
                            items={menuItems}
                            onClick={e => setActiveMenu(e.key)}
                            style={{ borderInlineEnd: 0 }}
                        />
                    </Drawer>
                )}

                <Layout>
                    <div
                        className="admin-header"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginRight: narrow ? 12 : 20,
                        }}
                    >
                        <Button
                            type="text"
                            aria-label={narrow ? 'Mở menu quản trị' : collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                            icon={
                                narrow ? (
                                    <MenuUnfoldOutlined />
                                ) : collapsed ? (
                                    React.createElement(MenuUnfoldOutlined)
                                ) : (
                                    React.createElement(MenuFoldOutlined)
                                )
                            }
                            onClick={() => (narrow ? setDrawerOpen(true) : setCollapsed(!collapsed))}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />

                        <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                            <Space style={{ minWidth: 0, cursor: 'pointer' }}>
                                {company && (
                                    <Tag
                                        color={COMPANY_STATUS[companyStatus(company)].color}
                                        style={{
                                            maxWidth: narrow ? 150 : undefined,
                                            margin: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {company.name}
                                        {company.approved ? '' : ` · ${COMPANY_STATUS[companyStatus(company)].label}`}
                                    </Tag>
                                )}
                                {!narrow && <>Xin chào, {user?.name}</>}
                                <Avatar
                                    src={user?.avatar ? avatarUrl(user.avatar) : undefined}
                                    style={{
                                        background: 'var(--brand-soft)',
                                        color: 'var(--brand-text)',
                                        fontWeight: 600,
                                    }}
                                >
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                            </Space>
                        </Dropdown>
                    </div>
                    <VerifyBanner />
                    <Content style={{ minWidth: 0, padding: narrow ? '12px' : '15px' }}>
                        {company && companyStatus(company) === 'PENDING' && (
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Công ty của bạn đang chờ quản trị viên duyệt"
                                description={
                                    <>
                                        Bạn có thể cập nhật thông tin công ty ngay bây giờ. Chức năng đăng tin sẽ mở sau
                                        khi công ty được duyệt.
                                        {todo.length > 0 && (
                                            <>
                                                <br />
                                                Còn thiếu để được duyệt: {todo.join('; ')}.
                                            </>
                                        )}
                                    </>
                                }
                            />
                        )}
                        {company && companyStatus(company) === 'REJECTED' && (
                            <Alert
                                type="error"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Công ty của bạn chưa được duyệt"
                                description={
                                    <>
                                        Lý do: {company.rejectionReason}
                                        <br />
                                        Hãy cập nhật thông tin công ty rồi lưu lại để gửi duyệt lần nữa.
                                    </>
                                }
                            />
                        )}
                        <Outlet />
                    </Content>
                    {/* <Footer style={{ padding: 10, textAlign: 'center' }}>
                        React Typescript series Nest.JS &copy; Hỏi Dân IT - Made with <HeartTwoTone />
                    </Footer> */}
                </Layout>
            </Layout>
            <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
            <Modal
                open={Boolean(user.company) && user.termsRequired}
                centered
                closable={false}
                maskClosable={false}
                keyboard={false}
                width={640}
                title="Điều khoản sử dụng dành cho nhà tuyển dụng"
                footer={[
                    <Button key="logout" onClick={handleLogout}>
                        Đăng xuất
                    </Button>,
                    <Button key="accept" type="primary" loading={acceptingTerms} onClick={acceptTerms}>
                        Tôi đã đọc và đồng ý
                    </Button>,
                ]}
            >
                <p>Để tiếp tục dùng tài khoản nhà tuyển dụng, vui lòng đọc và đồng ý với điều khoản dưới đây.</p>
                <div style={{ maxHeight: 'min(50vh, 440px)', overflowY: 'auto', paddingRight: 6 }}>
                    <EmployerTermsContent />
                </div>
            </Modal>
            <ChangeAvatarModal open={avatarOpen} onClose={() => setAvatarOpen(false)} />
        </ProLocale>
    );
};

export default LayoutAdmin;
