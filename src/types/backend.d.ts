export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: T[];
}

export interface IAccount {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: {
            id: string;
            name: string;
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[];
        };
        company?: { id: number; name: string; approved: boolean; rejectionReason?: string | null } | null;
        avatar?: string | null;
        emailVerified?: boolean;
        termsRequired?: boolean;
    };
}

export type IGetAccount = Omit<IAccount, 'access_token'>;

export interface ICompany {
    id?: string;
    name?: string;
    address?: string;
    logo: string;
    banner?: string;
    website?: string;
    mapEmbedUrl?: string;
    companyType?: 'PRODUCT' | 'OUTSOURCE';
    facebookUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    pinterestUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    description?: string;
    approved?: boolean;
    rejectionReason?: string | null;
    rejectedAt?: string | null;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ISkill {
    id?: string;
    name?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IUser {
    id?: string;
    name: string;
    email: string;
    password?: string;
    age: number;
    gender: string;
    address: string;
    role?: {
        id: string;
        name: string;
    };

    company?: {
        id: string;
        name: string;
    };
    locked?: boolean;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IJob {
    id?: string;
    name: string;
    skills: ISkill[];
    company?: { id: string; name: string } & Partial<Omit<ICompany, 'id' | 'name'>>;
    location: string;
    salary: number;
    salaryMax?: number | null;
    locked?: boolean;
    lockReason?: string | null;
    quantity: number;
    level: string;
    employmentType?: string | null;
    workMode?: string | null;
    description: string;
    startDate: Date;
    endDate: Date;
    active: boolean;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IResume {
    id?: string;
    email: string;
    userId: string;
    url: string;
    status: string;
    coverLetter?: string | null;
    score?: number | null;
    remark?: string | null;
    interviewAt?: string | null;
    meetingLink?: string | null;
    decisionNote?: string | null;
    companyName?: string;
    applicantPlan?: PlanCode | null;
    user?: { id: string; name: string };
    job?: { id: string; name: string };
    companyId:
        | string
        | {
              id: string;
              name: string;
              logo: string;
          };
    jobId:
        | string
        | {
              id: string;
              name: string;
          };
    history?: {
        status: string;
        updatedAt: Date;
        updatedBy: { id: string; email: string };
    }[];
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPermission {
    id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IRole {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    permissions: IPermission[] | string[];

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IReview {
    id: number;
    rating: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: { id: number; name: string };
    company: { id: number; name: string };
    userAvatar?: string | null;
    vip?: boolean;
}

export interface ICompanyReviews {
    average: number;
    total: number;
    distribution: Record<string, number>;
    meta: IModelPaginate<IReview>['meta'];
    result: IReview[];
}

export interface ISubscribers {
    id?: string;
    name?: string;
    email?: string;
    skills: ISkill[];
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IJobReport {
    id: number;
    createdAt: string;
    reason: 'SCAM' | 'MISLEADING' | 'DUPLICATE' | 'EXPIRED' | 'INAPPROPRIATE' | 'OTHER';
    detail?: string | null;
    user: { id: number; name: string; email: string };
    job: { id: number; name: string; companyName?: string; locked: boolean; lockReason?: string | null };
}

export type PlanCode = 'BASIC' | 'STANDARD' | 'PREMIUM';
export interface IPlan {
    code: PlanCode;
    name: string;
    priceVnd: number;
    days: number;
    alertSkills: number;
    savedJobs: number;
    highlight: boolean;
}
export interface IMyPlan {
    plan: PlanCode | null;
    name: string;
    expiresAt?: string | null;
    alertSkillCap: number;
    alertSkillsUsed: number;
    savedJobCap: number;
    savedJobsUsed: number;
}
export interface IOrder {
    id: number;
    plan: PlanCode;
    amount: number;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
    createdAt: string;
    paidAt?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    method?: string | null;
}
export interface IOAuthProvider {
    code: 'GOOGLE' | 'FACEBOOK' | 'LINKEDIN';
    enabled: boolean;
}
export interface IPaymentMethod {
    code: string;
    available: boolean;
}
export interface ICreateOrder {
    orderId: number;
    txnRef: string;
    paymentUrl: string;
    mock: boolean;
}
export interface IAdminStats {
    users: { total: number; candidates: number; employers: number; premium: number };
    companies: { total: number; approved: number; pending: number; rejected: number };
    jobs: { total: number; open: number; locked: number; reports: number };
    applications: { total: number; pending: number };
    revenue: {
        total: number;
        last30Days: number;
        paidOrders: number;
        payingUsers: number;
        byPlan: { plan: PlanCode; label: string; orders: number; amount: number }[];
    };
    months: { month: string; signups: number; applications: number; revenue: number }[];
}
export interface ITalent {
    id: number;
    name: string;
    avatar?: string | null;
    headline?: string | null;
    experience?: string | null;
    level?: string | null;
    industry?: string | null;
    occupation?: string | null;
    skills: IProfileSkill[];
    premium: boolean;
    hasCv: boolean;
    updatedAt?: string;
}
export interface ITalentDetail {
    talent: ITalent;
    email: string;
    shortGoals: string[];
    longGoals: string[];
    experiences: IProfileExperience[];
    cvName?: string | null;
}
export interface IAdminOrder {
    order: IOrder;
    txnRef: string;
    gatewayTxnNo?: string | null;
    bankCode?: string | null;
    responseCode?: string | null;
    userId: number;
    userName: string;
    userEmail: string;
}
export interface IPaymentResult {
    outcome: 'SUCCESS' | 'FAILED' | 'PENDING';
    message: string;
    order: IOrder;
}

export interface ISavedJob {
    id: number;
    createdAt: string;
    user: { id: number; name: string; email: string };
    job: { id: number; name: string; companyName?: string };
}

export interface IProfileExperience {
    company: string;
    title: string;
    fromMonth: string;
    toMonth?: string;
    current: boolean;
    description?: string;
}
export interface IProfileSkill {
    name: string;
    level: number;
}
export interface IProfileReference {
    name: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
}
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export interface IProfile {
    name: string;
    email: string;
    avatar?: string | null;
    age?: number | null;
    gender?: Gender | null;
    address?: string | null;
    headline?: string | null;
    experience?: string | null;
    level?: string | null;
    industry?: string | null;
    occupation?: string | null;
    jobAlert: boolean;
    visibleToEmployers: boolean;
    shortGoals: string[];
    longGoals: string[];
    experiences: IProfileExperience[];
    skills: IProfileSkill[];
    references: IProfileReference[];
    cvUrl?: string | null;
    cvName?: string | null;
    cvUpdatedAt?: string | null;
    updatedAt?: string | null;
}
