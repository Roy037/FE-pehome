import { IPermission } from '@/types/backend';
import { grey, green, blue, red, orange } from '@ant-design/colors';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import dayjs from 'dayjs';

export const SKILLS_LIST = [
    { label: 'React.JS', value: 'REACT.JS' },
    { label: 'React Native', value: 'REACT NATIVE' },
    { label: 'Vue.JS', value: 'VUE.JS' },
    { label: 'Angular', value: 'ANGULAR' },
    { label: 'Nest.JS', value: 'NEST.JS' },
    { label: 'TypeScript', value: 'TYPESCRIPT' },
    { label: 'Java', value: 'JAVA' },
    { label: 'Java Spring', value: 'JAVA SPRING' },
    { label: 'Frontend', value: 'FRONTEND' },
    { label: 'Backend', value: 'BACKEND' },
    { label: 'Fullstack', value: 'FULLSTACK' },
];

export const LOCATION_LIST = [
    { label: 'Hà Nội', value: 'HANOI' },
    { label: 'Hồ Chí Minh', value: 'HOCHIMINH' },
    { label: 'Đà Nẵng', value: 'DANANG' },
    { label: 'Địa điểm khác', value: 'OTHER' },
];

export const LEVEL_LIST = [
    { label: 'Thực tập sinh', value: 'INTERN' },
    { label: 'Fresher', value: 'FRESHER' },
    { label: 'Junior', value: 'JUNIOR' },
    { label: 'Middle', value: 'MIDDLE' },
    { label: 'Senior', value: 'SENIOR' },
];

export const EXPERIENCE_LIST = [
    { label: 'Chưa có kinh nghiệm', value: 'NONE' },
    { label: 'Dưới 1 năm', value: 'LT1' },
    { label: '1 – 3 năm', value: 'Y1_3' },
    { label: '3 – 5 năm', value: 'Y3_5' },
    { label: 'Trên 5 năm', value: 'GT5' },
];

export const INDUSTRY_LIST = [
    'Phần mềm & Dịch vụ CNTT',
    'Trí tuệ nhân tạo & Dữ liệu',
    'Fintech & Ngân hàng',
    'Thương mại điện tử',
    'Viễn thông & Hạ tầng',
    'Ô tô & Sản xuất thông minh',
    'Game & Giải trí số',
    'Y tế & Giáo dục số',
    'An ninh mạng',
    'Lĩnh vực khác',
];

export const OCCUPATION_LIST = [
    'Lập trình Backend',
    'Lập trình Frontend',
    'Lập trình Full-stack',
    'Lập trình Mobile (iOS/Android)',
    'Kiểm thử phần mềm (QA/QC)',
    'DevOps / Cloud',
    'Dữ liệu & AI/ML',
    'An ninh mạng',
    'Thiết kế UI/UX',
    'Quản lý sản phẩm (PM/PO)',
    'Phân tích nghiệp vụ (BA)',
    'Hệ thống nhúng / IoT',
    'Quản trị hệ thống & Mạng',
    'Ngành nghề khác',
];

export const SOFT_SKILL_SUGGESTIONS = [
    'Quản lý thời gian',
    'Giao tiếp tiếng Anh',
    'Làm việc nhóm',
    'Giải quyết vấn đề',
    'Thuyết trình',
    'Tư duy phản biện',
    'Tự học',
    'Quản lý dự án',
];

export const EMPLOYMENT_TYPE_LIST = [
    { label: 'Toàn thời gian', value: 'FULL_TIME' },
    { label: 'Bán thời gian', value: 'PART_TIME' },
    { label: 'Hợp đồng', value: 'CONTRACT' },
    { label: 'Thực tập', value: 'INTERNSHIP' },
];

export const COMPANY_TYPE_LIST = [
    { label: 'Sản phẩm (Product)', value: 'PRODUCT' },
    { label: 'Gia công (Outsource)', value: 'OUTSOURCE' },
];

export const JOB_REPORT_REASONS = [
    { label: 'Lừa đảo / yêu cầu đóng phí', value: 'SCAM' },
    { label: 'Thông tin sai lệch', value: 'MISLEADING' },
    { label: 'Tin trùng lặp', value: 'DUPLICATE' },
    { label: 'Tin đã hết hạn hoặc đã tuyển xong', value: 'EXPIRED' },
    { label: 'Nội dung không phù hợp', value: 'INAPPROPRIATE' },
    { label: 'Lý do khác', value: 'OTHER' },
];

export const WORK_MODE_LIST = [
    { label: 'Tại văn phòng', value: 'ONSITE' },
    { label: 'Làm từ xa', value: 'REMOTE' },
    { label: 'Linh hoạt', value: 'HYBRID' },
];

// The slider runs 0 – 100 triệu đ; the top end means "no upper limit".
export const SALARY_MAX_M = 100;

// A posting is a range [salary, salaryMax]; it matches the slider range when the two overlap (no maximum = open-ended).
// Postings without a salary are left out unless `withNegotiable`.
export const salaryRangeFilter = (low: number, high: number, withNegotiable: boolean) => {
    const M = 1_000_000;
    const parts = ['(salary > 0 or salaryMax > 0)'];
    if (high < SALARY_MAX_M) parts.push(`salary <: ${high * M}`);
    if (low > 0) parts.push(`(salaryMax is null or salaryMax >: ${low * M})`);
    const range = parts.join(' and ');
    return withNegotiable ? `(${range} or (salary : 0 and (salaryMax is null or salaryMax : 0)))` : `(${range})`;
};
export const RESUME_STATUS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Đang chờ', color: 'gold' },
    REVIEWING: { label: 'Đang xem xét', color: 'blue' },
    SHORTLISTED: { label: 'Vào danh sách rút gọn', color: 'cyan' },
    INTERVIEW: { label: 'Mời phỏng vấn', color: 'purple' },
    ACCEPTED: { label: 'Được nhận', color: 'green' },
    REJECTED: { label: 'Chưa phù hợp', color: 'red' },
};

// Mirror of ResumeStateEnum.next() on the server: the steps an employer can take from each status.
export const RESUME_NEXT: Record<string, string[]> = {
    PENDING: ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
    REVIEWING: ['SHORTLISTED', 'REJECTED'],
    SHORTLISTED: ['INTERVIEW', 'REJECTED'],
    INTERVIEW: ['ACCEPTED', 'REJECTED'],
    ACCEPTED: [],
    REJECTED: [],
};

// The "Shortlist" tab: everyone who has passed the shortlist stage.
export const SHORTLIST_STATUSES = ['SHORTLISTED', 'INTERVIEW', 'ACCEPTED'];

// A CV is either a PDF stored on our server (a bare file name) or a link to one on these cloud drives (same list as the server).
const CLOUD_HOSTS = [
    'drive.google.com',
    'docs.google.com',
    'dropbox.com',
    'dl.dropboxusercontent.com',
    'onedrive.live.com',
    '1drv.ms',
    'sharepoint.com',
];
export const isExternalCv = (url?: string | null) => /^https:\/\//i.test(url ?? '');
export const isCloudLink = (value: string) => {
    try {
        const url = new URL(value.trim());
        return (
            url.protocol === 'https:' &&
            !url.username &&
            !url.password &&
            value.trim().length <= 255 &&
            CLOUD_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
        );
    } catch {
        return false;
    }
};

export const labelOf = (list: { label: string; value: string }[], value?: string | null) =>
    list.find(item => item.value === value)?.label;

// spring-filter-query-builder does not escape string literals itself.
export const errorMessage = (message: unknown, fallback = 'Vui lòng thử lại.') =>
    ((Array.isArray(message) ? message[0] : message) as string) || fallback;

export const escapeFilter = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const MONEY = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const unitOf = (value: number) =>
    value >= 1e9 ? { div: 1e9, name: 'tỷ' } : value >= 1e6 ? { div: 1e6, name: 'triệu' } : null;
const amount = (value: number, compact: boolean) => {
    if (!compact) return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
    const unit = unitOf(value);
    return unit ? `${MONEY.format(value / unit.div)} ${unit.name} đ` : `${MONEY.format(value)} đ`;
};

// "20 – 30 triệu đ", "Từ 15 triệu đ", "Tới 40 triệu đ", a single amount, or "Thỏa thuận" (0 and no maximum).
export const formatSalary = (salary: number, salaryMax?: number | null, compact = false) => {
    const min = salary > 0 ? salary : 0;
    const max = salaryMax && salaryMax > 0 ? salaryMax : 0;
    if (!min && !max) return 'Thỏa thuận';
    if (!max) return `Từ ${amount(min, compact)}`;
    if (!min) return `Tới ${amount(max, compact)}`;
    if (min === max) return amount(min, compact);
    if (compact) {
        const low = unitOf(min),
            high = unitOf(max);
        if (low && high && low.name === high.name)
            return `${MONEY.format(min / low.div)} – ${MONEY.format(max / high.div)} ${high.name} đ`;
    }
    return `${amount(min, compact)} – ${amount(max, compact)}`;
};

// A posting is "negotiable" when it carries neither a minimum nor a maximum.
export const isNegotiable = (salary?: number | null, salaryMax?: number | null) =>
    !(salary && salary > 0) && !(salaryMax && salaryMax > 0);

export const formatDate = (value?: string | Date | null) =>
    value && !Number.isNaN(new Date(value).getTime())
        ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null;

// "hôm nay", "3 ngày trước", "2 tuần trước"… for the job's last-activity line.
export const timeAgo = (value?: string | Date | null) => {
    const time = value ? new Date(value).getTime() : NaN;
    if (Number.isNaN(time)) return null;
    const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
    if (days < 1) return 'hôm nay';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
    return `${Math.floor(days / 365)} năm trước`;
};

// Jobs a candidate can act on today: switched on, already started and not past the deadline. Same rule as ResumeService.create.
export const openJobsFilter = () => {
    const now = new Date().toISOString();
    return `active : true and locked : false and (endDate is null or endDate > '${now}') and (startDate is null or startDate <= '${now}')`;
};

// A company is approved, rejected (not approved + a reason from the admin) or still pending review.
export const COMPANY_STATUS = {
    APPROVED: { label: 'Đã duyệt', color: 'green' },
    PENDING: { label: 'Chờ duyệt', color: 'gold' },
    REJECTED: { label: 'Bị từ chối', color: 'red' },
};
export const companyStatus = (
    company?: { approved?: boolean; rejectionReason?: string | null } | null,
): keyof typeof COMPANY_STATUS =>
    company?.approved !== false ? 'APPROVED' : company.rejectionReason ? 'REJECTED' : 'PENDING';
export const ORDER_STATUS: Record<'PAID' | 'PENDING' | 'FAILED' | 'EXPIRED', { label: string; color: string }> = {
    PAID: { label: 'Đã thanh toán', color: 'green' },
    PENDING: { label: 'Đang chờ', color: 'gold' },
    FAILED: { label: 'Không thành công', color: 'red' },
    EXPIRED: { label: 'Hết hạn', color: 'default' },
};
export const formatVnd = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

export const getCityName = (value?: string) => labelOf(LOCATION_LIST, value) ?? (value || 'Chưa cập nhật');

export const jobPath = (job: { id?: string | number; name: string }) => `/job/${convertSlug(job.name)}?id=${job.id}`;
export const companyPath = (company: { id?: string | number; name?: string }) =>
    `/company/${convertSlug(company.name || 'cong-ty')}?id=${company.id}`;

export const nonAccentVietnamese = (str: string) => {
    str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, 'A');
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, 'E');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/I|Í|Ì|Ĩ|Ị/g, 'I');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, 'O');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, 'U');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, 'Y');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/Đ/g, 'D');
    str = str.replace(/đ/g, 'd');
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
    return str;
};

export const convertSlug = (str: string) => {
    str = nonAccentVietnamese(str);
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from =
        'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆĞÍÌÎÏİŇÑÓÖÒÔÕØŘŔŠŞŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇğíìîïıňñóöòôõøðřŕšşťúůüùûýÿžþÞĐđßÆa·/_,:;';
    const to =
        'AAAAAACCCDEEEEEEEEGIIIIINNOOOOOORRSSTUUUUUYYZaaaaaacccdeeeeeeeegiiiiinnooooooorrsstuuuuuyyzbBDdBAa------';
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str
        .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
};

export const getLocationName = (value: string) => {
    const locationFilter = LOCATION_LIST.filter(item => item.value === value);
    if (locationFilter.length) return locationFilter[0].label;
    return 'unknown';
};

export function colorMethod(method: 'POST' | 'PUT' | 'GET' | 'DELETE' | string) {
    switch (method) {
        case 'POST':
            return green[6];
        case 'PUT':
            return orange[6];
        case 'GET':
            return blue[6];
        case 'DELETE':
            return red[6];
        default:
            return grey[10];
    }
}

export const groupByPermission = (data: any[]): { module: string; permissions: IPermission[] }[] => {
    const groupedData = groupBy(data, x => x.module);
    return map(groupedData, (value, key) => {
        return { module: key, permissions: value as IPermission[] };
    });
};

// A path on this site, from a query string: anything else (another site, a protocol-relative address) becomes the home page.
export const OAuthNext = (next: string | null) => (next && /^\/(?!\/)[^\s<>\\]*$/.test(next) ? next : '/');

// What a job post is doing right now. The public pages show only OPEN posts (see openJobsFilter); the employer and admin
// lists use this so a post that is scheduled, expired, paused or locked is not mislabelled "Đang tuyển".
export type JobState = 'OPEN' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED' | 'LOCKED';
export const JOB_STATE: Record<JobState, { label: string; color: string }> = {
    OPEN: { label: 'Đang tuyển', color: 'lime' },
    SCHEDULED: { label: 'Hẹn đăng', color: 'gold' },
    EXPIRED: { label: 'Đã hết hạn', color: 'default' },
    PAUSED: { label: 'Tạm ẩn', color: 'red' },
    LOCKED: { label: 'Bị khóa', color: 'volcano' },
};
export const jobState = (job: {
    active?: boolean;
    locked?: boolean;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
}): JobState => {
    if (job.locked) return 'LOCKED';
    if (!job.active) return 'PAUSED';
    const now = dayjs();
    if (job.startDate && dayjs(job.startDate).isAfter(now)) return 'SCHEDULED';
    if (job.endDate && dayjs(job.endDate).isBefore(now)) return 'EXPIRED';
    return 'OPEN';
};
