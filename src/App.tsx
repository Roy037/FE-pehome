import { lazy, Suspense, useEffect } from 'react';
import Loading from 'components/share/loading';
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchSavedJobs } from '@/redux/slice/savedJobSlide';
import { fetchFollowedCompanies } from '@/redux/slice/followedCompanySlide';
import { fetchMyPlanCode } from '@/redux/slice/planSlide';
import { AccountModalProvider } from 'components/client/modal/manage.account';
import { AuthModalProvider } from 'components/client/auth';
import VerifyBanner from 'components/client/verify-banner';
import { UpgradeModalProvider } from 'components/client/modal/upgrade.modal';
import NotFound from 'components/share/not.found';
import ProtectedRoute from 'components/share/protected-route';
import Header from 'components/client/header.client';
import Footer from 'components/client/footer.client';
import HomePage from 'pages/home';
import styles from 'styles/app.module.scss';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
const LoginPage = lazy(() => import('pages/auth/login'));
const RegisterPage = lazy(() => import('pages/auth/register'));
const ForgotPasswordPage = lazy(() => import('pages/auth/forgot-password'));
const EmployerTermsPage = lazy(() => import('pages/legal/employer-terms'));
const ResetPasswordPage = lazy(() => import('pages/auth/reset-password'));
const OAuthCompletePage = lazy(() => import('pages/auth/oauth-complete'));
const OrderPage = lazy(() => import('pages/admin/order'));
const VerifyEmailPage = lazy(() => import('pages/auth/email-action').then(m => ({ default: m.VerifyEmailPage })));
const UnsubscribePage = lazy(() => import('pages/auth/email-action').then(m => ({ default: m.UnsubscribePage })));
const ClientJobPage = lazy(() => import('./pages/job'));
const ClientJobDetailPage = lazy(() => import('./pages/job/detail'));
const ClientCompanyPage = lazy(() => import('./pages/company'));
const ClientCompanyDetailPage = lazy(() => import('./pages/company/detail'));
const ProfilePage = lazy(() => import('./pages/profile'));
const EmployerAuthPage = lazy(() =>
    import('components/client/employer-auth').then(module => ({ default: module.EmployerAuthPage })),
);
const LayoutAdmin = lazy(() => import('./components/admin/layout.admin'));
const DashboardPage = lazy(() => import('./pages/admin/dashboard'));
const CompanyPage = lazy(() => import('./pages/admin/company'));
const PermissionPage = lazy(() => import('./pages/admin/permission'));
const ResumePage = lazy(() => import('./pages/admin/resume'));
const RolePage = lazy(() => import('./pages/admin/role'));
const UserPage = lazy(() => import('./pages/admin/user'));
const ReviewPage = lazy(() => import('./pages/admin/review'));
const SavedJobPage = lazy(() => import('./pages/admin/saved-job'));
const JobReportPage = lazy(() => import('./pages/admin/job-report'));
const TalentPage = lazy(() => import('./pages/admin/talent'));
const SubscriberPage = lazy(() => import('./pages/admin/subscriber'));
const ViewUpsertJob = lazy(() => import('./components/admin/job/upsert.job'));
const JobTabs = lazy(() => import('./pages/admin/job/job.tabs'));

const LayoutClient = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            document.getElementById(location.hash.slice(1))?.scrollIntoView();
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [location.pathname, location.hash]);

    return (
        <AuthModalProvider>
            <UpgradeModalProvider>
                <AccountModalProvider>
                    <div className="layout-app">
                        <Header />
                        <VerifyBanner />
                        <main id="main-content" tabIndex={-1} className={styles['content-app']}>
                            <div key={location.pathname} className="page-in">
                                <Suspense fallback={<Loading />}>
                                    <Outlet />
                                </Suspense>
                            </div>
                        </main>
                        <Footer />
                    </div>
                </AccountModalProvider>
            </UpgradeModalProvider>
        </AuthModalProvider>
    );
};

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <LayoutApp>
                <LayoutClient />
            </LayoutApp>
        ),
        errorElement: <NotFound />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'job', element: <ClientJobPage /> },
            { path: 'job/:id', element: <ClientJobDetailPage /> },
            { path: 'company', element: <ClientCompanyPage /> },
            { path: 'company/:id', element: <ClientCompanyDetailPage /> },
            { path: 'ho-so', element: <ProfilePage /> },
            { path: 'dieu-khoan-nha-tuyen-dung', element: <EmployerTermsPage /> },
        ],
    },

    {
        path: '/admin',
        element: (
            <LayoutApp>
                <LayoutAdmin />{' '}
            </LayoutApp>
        ),
        errorElement: <NotFound />,
        children: [
            {
                index: true,
                element: (
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'company',
                element: (
                    <ProtectedRoute>
                        <CompanyPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user',
                element: (
                    <ProtectedRoute>
                        <UserPage />
                    </ProtectedRoute>
                ),
            },

            {
                path: 'job',
                children: [
                    {
                        index: true,
                        element: (
                            <ProtectedRoute>
                                <JobTabs />
                            </ProtectedRoute>
                        ),
                    },
                    {
                        path: 'upsert',
                        element: (
                            <ProtectedRoute>
                                <ViewUpsertJob />
                            </ProtectedRoute>
                        ),
                    },
                ],
            },

            {
                path: 'resume',
                element: (
                    <ProtectedRoute>
                        <ResumePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'review',
                element: (
                    <ProtectedRoute>
                        <ReviewPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'job-report',
                element: (
                    <ProtectedRoute>
                        <JobReportPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'talent',
                element: (
                    <ProtectedRoute>
                        <TalentPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'saved-job',
                element: (
                    <ProtectedRoute>
                        <SavedJobPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'subscriber',
                element: (
                    <ProtectedRoute>
                        <SubscriberPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'order',
                element: (
                    <ProtectedRoute>
                        <OrderPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'permission',
                element: (
                    <ProtectedRoute>
                        <PermissionPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'role',
                element: (
                    <ProtectedRoute>
                        <RolePage />
                    </ProtectedRoute>
                ),
            },
        ],
    },

    {
        path: '/login',
        element: <LoginPage />,
    },

    {
        path: '/register',
        element: <RegisterPage />,
    },

    {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
    },

    {
        path: '/reset-password',
        element: <ResetPasswordPage />,
    },

    {
        path: '/dang-nhap-xong',
        element: <OAuthCompletePage />,
    },

    {
        path: '/xac-thuc-email',
        element: <VerifyEmailPage />,
    },

    {
        path: '/huy-nhan-tin',
        element: <UnsubscribePage />,
    },

    {
        path: '/nha-tuyen-dung/dang-nhap',
        element: <EmployerAuthPage mode="login" />,
    },

    {
        path: '/nha-tuyen-dung/dang-ky',
        element: <EmployerAuthPage mode="register" />,
    },
]);

export default function App() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);

    useEffect(() => {
        if (localStorage.getItem('access_token')) dispatch(fetchAccount());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchSavedJobs());
            dispatch(fetchFollowedCompanies());
            dispatch(fetchMyPlanCode());
        }
    }, [dispatch, isAuthenticated]);

    return (
        <Suspense fallback={<Loading />}>
            <RouterProvider router={router} />
        </Suspense>
    );
}
