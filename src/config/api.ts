import {
    IAdminOrder,
    IAdminStats,
    ITalent,
    ITalentDetail,
    IJobReport,
    ICreateOrder,
    IMyPlan,
    IOrder,
    IOAuthProvider,
    IPaymentMethod,
    IPaymentResult,
    IPlan,
    IBackendRes,
    ICompany,
    IAccount,
    IProfile,
    IUser,
    IModelPaginate,
    IGetAccount,
    IJob,
    IResume,
    IPermission,
    IRole,
    ISkill,
    ISubscribers,
    IReview,
    ICompanyReviews,
    ISavedJob,
} from '@/types/backend';
import axios from 'config/axios-customize';

/**
 * 
Module Auth
 */
export const callRegister = (name: string, email: string, password: string, age: number, gender: string) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register', { name, email, password, age, gender });
};

export const callRegisterEmployer = (data: {
    companyName: string;
    companyAddress: string;
    name: string;
    email: string;
    password: string;
}) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register-employer', data);
};

export const callForgotPassword = (email: string) => {
    return axios.post<IBackendRes<null>>('/api/v1/auth/forgot-password', { email });
};

export const callResetPassword = (token: string, newPassword: string) => {
    return axios.post<IBackendRes<null>>('/api/v1/auth/reset-password', { token, newPassword });
};

export const callFetchOAuthProviders = () => {
    return axios.get<IBackendRes<IOAuthProvider[]>>('/api/v1/auth/oauth/providers');
};

export const oauthStartUrl = (provider: string, next: string) =>
    `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/oauth/${provider.toLowerCase()}/authorize?next=${encodeURIComponent(next)}`;

export const callSaveMyAvatar = (avatar: string) => {
    return axios.put<IBackendRes<null>>('/api/v1/me/profile/avatar', { avatar });
};

export const callChangePassword = (currentPassword: string, newPassword: string) => {
    return axios.post<IBackendRes<null>>('/api/v1/auth/change-password', { currentPassword, newPassword });
};

export const callVerifyEmail = (token: string) => {
    return axios.post<IBackendRes<null>>('/api/v1/auth/verify-email', { token });
};

export const callResendVerification = () => {
    return axios.post<IBackendRes<null>>('/api/v1/auth/resend-verification');
};

export const callUnsubscribe = (token: string) => {
    return axios.post<IBackendRes<null>>('/api/v1/subscribers/unsubscribe', null, { params: { token } });
};

export const callCheckApplied = (jobId: string | number) => {
    return axios.get<IBackendRes<{ applied: boolean }>>('/api/v1/resumes/check-applied', { params: { jobId } });
};

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password });
};

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account');
};

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh');
};

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout');
};

/**
 * Upload single file
 */
export const callFetchDocument = (endpoint: string) =>
    axios.get<Blob>(endpoint, { responseType: 'blob' }) as unknown as Promise<Blob | undefined>;

export const callUploadSingleFile = (file: any, folderType: string, onProgress?: (percent: number) => void) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    bodyFormData.append('folder', folderType);

    return axios<IBackendRes<{ fileName: string }>>({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: event => {
            if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
        },
    });
};

/**
 * Saved jobs & reviews (current user)
 */
export const callFetchMyProfile = () => axios.get<IBackendRes<IProfile>>('/api/v1/me/profile');
export const callSaveMyProfile = (profile: Omit<IProfile, 'email' | 'updatedAt' | 'cvUpdatedAt'>) =>
    axios.put<IBackendRes<IProfile>>('/api/v1/me/profile', profile);
export const callFetchSavedJobs = () => axios.get<IBackendRes<IJob[]>>('/api/v1/me/saved-jobs');
export const callSaveJob = (jobId: string) => axios.put<IBackendRes<null>>(`/api/v1/me/saved-jobs/${jobId}`);
export const callUnsaveJob = (jobId: string) => axios.delete<IBackendRes<null>>(`/api/v1/me/saved-jobs/${jobId}`);
export const callReportJob = (jobId: string, reason: string, detail?: string) =>
    axios.post<IBackendRes<null>>('/api/v1/me/job-reports', { jobId: Number(jobId), reason, detail });
export const callFetchJobReports = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IJobReport>>>(`/api/v1/job-reports?${query}`);
export const callDeleteJobReport = (id: number) => axios.delete<IBackendRes<null>>(`/api/v1/job-reports/${id}`);
export const callLockJob = (id: string | number, reason: string) =>
    axios.put<IBackendRes<IJob>>(`/api/v1/jobs/${id}/lock`, { reason });
export const callUnlockJob = (id: string | number) => axios.put<IBackendRes<IJob>>(`/api/v1/jobs/${id}/unlock`);
export const callFetchPlans = () => axios.get<IBackendRes<IPlan[]>>('/api/v1/plans');
export const callFetchMyPlan = () => axios.get<IBackendRes<IMyPlan>>('/api/v1/me/plan');
export const callFetchAdminStats = () => axios.get<IBackendRes<IAdminStats>>('/api/v1/admin/stats');
export const callFetchOrders = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IAdminOrder>>>(`/api/v1/orders?${query}`);
export const callFetchTalents = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<ITalent>>>(`/api/v1/talents?${query}`);
export const callFetchTalent = (id: number) => axios.get<IBackendRes<ITalentDetail>>(`/api/v1/talents/${id}`);
export const callFetchMyOrders = () => axios.get<IBackendRes<IOrder[]>>('/api/v1/me/orders');
export const callCreateOrder = (plan: string, method?: string) =>
    axios.post<IBackendRes<ICreateOrder>>('/api/v1/me/orders', { plan, method });
export const callFetchPaymentMethods = () => axios.get<IBackendRes<IPaymentMethod[]>>('/api/v1/payments/methods');
export const callVnpayReturn = (query: string) =>
    axios.get<IBackendRes<IPaymentResult>>(`/api/v1/payments/vnpay-return${query}`);
export const callMomoReturn = (txnRef: string) =>
    axios.get<IBackendRes<IPaymentResult>>('/api/v1/me/orders/momo-result', { params: { txnRef } });
export const callZalopayReturn = (txnRef: string) =>
    axios.get<IBackendRes<IPaymentResult>>('/api/v1/me/orders/zalopay-result', { params: { txnRef } });
export const callMockOrder = (txnRef: string) =>
    axios.get<IBackendRes<IOrder>>(`/api/v1/payments/mock/order?txnRef=${encodeURIComponent(txnRef)}`);
export const callMockComplete = (txnRef: string, success: boolean) =>
    axios.post<IBackendRes<{ returnUrl: string }>>('/api/v1/payments/mock/complete', { txnRef, success });
export const callFetchFollowedCompanies = () => axios.get<IBackendRes<ICompany[]>>('/api/v1/me/followed-companies');
export const callFollowCompany = (companyId: string) =>
    axios.put<IBackendRes<null>>(`/api/v1/me/followed-companies/${companyId}`);
export const callUnfollowCompany = (companyId: string) =>
    axios.delete<IBackendRes<null>>(`/api/v1/me/followed-companies/${companyId}`);

export const callFetchCompanyReviews = (companyId: string, query: string) =>
    axios.get<IBackendRes<ICompanyReviews>>(`/api/v1/companies/${companyId}/reviews?${query}`);
export const callFetchMyReview = (companyId: string) =>
    axios.get<IBackendRes<IReview | null>>(`/api/v1/me/reviews/${companyId}`);
export const callSaveMyReview = (companyId: string, rating: number, content: string) =>
    axios.put<IBackendRes<IReview>>(`/api/v1/me/reviews/${companyId}`, { rating, content });
export const callDeleteMyReview = (companyId: string) =>
    axios.delete<IBackendRes<null>>(`/api/v1/me/reviews/${companyId}`);

export const callFetchReviews = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IReview>>>(`/api/v1/reviews?${query}`);
export const callDeleteReview = (id: string | number) => axios.delete<IBackendRes<null>>(`/api/v1/reviews/${id}`);

interface IReviewInput {
    userId: number;
    companyId: number;
    rating: number;
    content: string;
}
export const callCreateReview = (data: IReviewInput) => axios.post<IBackendRes<IReview>>('/api/v1/reviews', data);
export const callUpdateReview = (data: IReviewInput & { id: number }) =>
    axios.put<IBackendRes<IReview>>('/api/v1/reviews', data);

export const callFetchAllSavedJobs = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<ISavedJob>>>(`/api/v1/saved-jobs?${query}`);
export const callCreateSavedJob = (userId: number, jobId: number) =>
    axios.post<IBackendRes<ISavedJob>>('/api/v1/saved-jobs', { userId, jobId });
export const callDeleteSavedJob = (id: number) => axios.delete<IBackendRes<null>>(`/api/v1/saved-jobs/${id}`);

/**
 * 
Module Company
 */
export const callRejectCompany = (id: string | number, reason: string) =>
    axios.put<IBackendRes<ICompany>>(`/api/v1/companies/${id}/reject`, { reason });
export const callApproveCompany = (id: string | number) =>
    axios.put<IBackendRes<ICompany>>(`/api/v1/companies/${id}/approve`);
export const callCreateCompany = (company: ICompany) => {
    return axios.post<IBackendRes<ICompany>>('/api/v1/companies', company);
};

export const callUpdateCompany = (company: ICompany) => {
    return axios.put<IBackendRes<ICompany>>(`/api/v1/companies`, company);
};

export const callDeleteCompany = (id: string) => {
    return axios.delete<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
};

export const callFetchCompany = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICompany>>>(`/api/v1/companies?${query}`);
};

export const callFetchCompanyById = (id: string) => {
    return axios.get<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
};

/**
 * 
Module Skill
 */
export const callCreateSkill = (name: string) => {
    return axios.post<IBackendRes<ISkill>>('/api/v1/skills', { name });
};

export const callUpdateSkill = (id: string, name: string) => {
    return axios.put<IBackendRes<ISkill>>(`/api/v1/skills`, { id, name });
};

export const callDeleteSkill = (id: string) => {
    return axios.delete<IBackendRes<ISkill>>(`/api/v1/skills/${id}`);
};

export const callFetchAllSkill = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISkill>>>(`/api/v1/skills?${query}`);
};

/**
 * 
Module User
 */
export const callCreateUser = (user: IUser) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/users', { ...user });
};

export const callUpdateUser = (user: IUser) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user });
};

export const callLockUser = (id: string, locked: boolean) =>
    axios.put<IBackendRes<IUser>>(`/api/v1/users/${id}/${locked ? 'lock' : 'unlock'}`);
export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
};

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
};

/**
 * 
Module Job
 */
export const callCreateJob = (job: IJob) => {
    return axios.post<IBackendRes<IJob>>('/api/v1/jobs', { ...job });
};

export const callUpdateJob = (job: IJob, id: string) => {
    return axios.put<IBackendRes<IJob>>(`/api/v1/jobs`, { id, ...job });
};

export const callDeleteJob = (id: string) => {
    return axios.delete<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
};

export const callFetchJob = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs?${query}`);
};

export const callFetchJobById = (id: string) => {
    return axios.get<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
};

/**
 * 
Module Resume
 */
export const callCreateResume = (
    url: string,
    jobId: any,
    email: string,
    userId: string | number,
    coverLetter?: string,
) => {
    return axios.post<IBackendRes<IResume>>('/api/v1/resumes', {
        email,
        url,
        coverLetter: coverLetter?.trim() || undefined,
        status: 'PENDING',
        user: {
            id: userId,
        },
        job: {
            id: jobId,
        },
    });
};

export interface IStatusChange {
    status: string;
    interviewAt?: string;
    meetingLink?: string;
    decisionNote?: string;
    notify?: boolean;
}

export const callChangeResumeStatus = (id: string | number, change: IStatusChange) => {
    return axios.put<IBackendRes<IResume>>(`/api/v1/resumes/${id}/status`, change);
};

export const callEvaluateResume = (id: string | number, score: number, remark: string) => {
    return axios.put<IBackendRes<IResume>>(`/api/v1/resumes/${id}/evaluation`, { score, remark });
};

export const callDeleteResume = (id: string) => {
    return axios.delete<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
};

export const callFetchResume = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes?${query}`);
};

export const callFetchResumeById = (id: string) => {
    return axios.get<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
};

export const callFetchResumeByUser = () => {
    return axios.post<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes/by-user`);
};

/**
 * 
Module Permission
 */
export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', { ...permission });
};

export const callUpdatePermission = (permission: IPermission, id: string) => {
    return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, { id, ...permission });
};

export const callDeletePermission = (id: string) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
};

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
};

export const callFetchPermissionById = (id: string) => {
    return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
};

/**
 * 
Module Role
 */
export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', { ...role });
};

export const callUpdateRole = (role: IRole, id: string) => {
    return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { id, ...role });
};

export const callDeleteRole = (id: string) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
};

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
};

export const callFetchRoleById = (id: string) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
};

/**
 * 
Module Subscribers
 */
export const callCreateSubscriber = (subs: ISubscribers) => {
    return axios.post<IBackendRes<ISubscribers>>('/api/v1/subscribers', { ...subs });
};

export const callGetSubscriberSkills = () => {
    return axios.post<IBackendRes<ISubscribers>>('/api/v1/subscribers/skills');
};

export const callUpdateSubscriber = (subs: ISubscribers) => {
    return axios.put<IBackendRes<ISubscribers>>(`/api/v1/subscribers`, { ...subs });
};

export const callUpdateSubscriberById = (id: string | number, subs: ISubscribers) => {
    return axios.put<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`, { ...subs });
};

export const callDeleteSubscriber = (id: string) => {
    return axios.delete<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`);
};

export const callFetchSubscriber = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISubscribers>>>(`/api/v1/subscribers?${query}`);
};

export const callFetchSubscriberById = (id: string) => {
    return axios.get<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`);
};
