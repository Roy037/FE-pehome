import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    OAuthNext,
    RESUME_NEXT,
    RESUME_STATUS,
    companyStatus,
    convertSlug,
    errorMessage,
    formatSalary,
    isCloudLink,
    isCvFile,
    isNegotiable,
    jobPath,
    jobState,
    salaryRangeFilter,
    timeAgo,
} from '@/config/utils';

const DAY = 86_400_000;

describe('formatSalary', () => {
    it('says negotiable when neither bound is given', () => {
        expect(formatSalary(0, null)).toBe('Thỏa thuận');
        expect(isNegotiable(0, 0)).toBe(true);
        expect(isNegotiable(15_000_000, null)).toBe(false);
    });

    it('shows an open-ended range from one bound', () => {
        expect(formatSalary(15_000_000, null)).toBe('Từ 15.000.000 đ');
        expect(formatSalary(0, 20_000_000)).toBe('Tới 20.000.000 đ');
        expect(formatSalary(15_000_000, 15_000_000)).toBe('15.000.000 đ');
    });

    it('shortens a range to one unit when both bounds share it', () => {
        expect(formatSalary(15_000_000, 20_000_000)).toBe('15.000.000 đ – 20.000.000 đ');
        expect(formatSalary(15_000_000, 20_000_000, true)).toBe('15 – 20 triệu đ');
        expect(formatSalary(800_000_000, 1_200_000_000, true)).toBe('800 triệu đ – 1,2 tỷ đ');
    });
});

describe('salaryRangeFilter', () => {
    it('keeps jobs whose range reaches the chosen band', () => {
        expect(salaryRangeFilter(10, 100, false)).toBe(
            '((salary > 0 or salaryMax > 0) and (salaryMax is null or salaryMax >: 10000000))',
        );
    });

    it('can also keep negotiable jobs', () => {
        expect(salaryRangeFilter(0, 30, true)).toBe(
            '((salary > 0 or salaryMax > 0) and salary <: 30000000 or (salary : 0 and (salaryMax is null or salaryMax : 0)))',
        );
    });
});

describe('CV files and links', () => {
    it('accepts PDF, Word and images whatever the case of the extension', () => {
        expect(isCvFile('CV-Tieng-Anh.PDF')).toBe(true);
        expect(isCvFile('cv.docx')).toBe(true);
        expect(isCvFile('ielts.webp')).toBe(true);
        expect(isCvFile('virus.exe')).toBe(false);
        expect(isCvFile('no-extension')).toBe(false);
    });

    it('accepts only https links to Drive, Dropbox or OneDrive', () => {
        expect(isCloudLink('https://drive.google.com/file/d/abc/view')).toBe(true);
        expect(isCloudLink('  https://www.dropbox.com/s/abc/cv.pdf  ')).toBe(true);
        expect(isCloudLink('http://drive.google.com/file/d/abc')).toBe(false);
        expect(isCloudLink('https://drive.google.com.evil.example/cv.pdf')).toBe(false);
        expect(isCloudLink('https://user:secret@drive.google.com/cv.pdf')).toBe(false);
        expect(isCloudLink(`https://drive.google.com/${'a'.repeat(260)}`)).toBe(false);
        expect(isCloudLink('not a link')).toBe(false);
    });
});

describe('OAuthNext', () => {
    it('only sends people back to a page of this site after social sign-in', () => {
        expect(OAuthNext('/ho-so')).toBe('/ho-so');
        expect(OAuthNext('/job?id=40')).toBe('/job?id=40');
        expect(OAuthNext('//evil.example')).toBe('/');
        expect(OAuthNext('https://evil.example')).toBe('/');
        expect(OAuthNext('/\\evil.example')).toBe('/');
        expect(OAuthNext(null)).toBe('/');
    });
});

describe('links and labels', () => {
    it('builds readable job links from Vietnamese titles', () => {
        expect(convertSlug('Kỹ sư phần mềm nhúng (C/C++)')).toBe('ky-su-phan-mem-nhung-c-c');
        expect(convertSlug('NHÂN VIÊN KẾ TOÁN')).toBe('nhan-vien-ke-toan');
        expect(convertSlug('CÔNG TY CỔ PHẦN ĐIỆN TỬ VIỄN THÔNG')).toBe('cong-ty-co-phan-dien-tu-vien-thong');
        expect(jobPath({ id: 40, name: 'Lập trình viên .NET' })).toBe('/job/lap-trinh-vien-net?id=40');
    });

    it('takes the first server message or falls back', () => {
        expect(errorMessage(['Email đã tồn tại', 'khác'])).toBe('Email đã tồn tại');
        expect(errorMessage('')).toBe('Vui lòng thử lại.');
        expect(errorMessage(undefined, 'Chưa thể lưu')).toBe('Chưa thể lưu');
    });

    it('tells approved, pending and rejected companies apart', () => {
        expect(companyStatus({ approved: true })).toBe('APPROVED');
        expect(companyStatus({ approved: false })).toBe('PENDING');
        expect(companyStatus({ approved: false, rejectionReason: 'Thiếu giấy phép' })).toBe('REJECTED');
    });
});

describe('jobState', () => {
    const now = Date.now();

    it('puts locks and pauses ahead of dates', () => {
        expect(jobState({ active: true, locked: true })).toBe('LOCKED');
        expect(jobState({ active: false })).toBe('PAUSED');
    });

    it('follows the start and end dates', () => {
        expect(jobState({ active: true, startDate: new Date(now + DAY) })).toBe('SCHEDULED');
        expect(jobState({ active: true, endDate: new Date(now - DAY) })).toBe('EXPIRED');
        expect(jobState({ active: true, startDate: new Date(now - DAY), endDate: new Date(now + DAY) })).toBe('OPEN');
    });
});

describe('RESUME_NEXT', () => {
    it('matches the pipeline the server enforces', () => {
        expect(RESUME_NEXT).toEqual({
            PENDING: ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
            REVIEWING: ['SHORTLISTED', 'REJECTED'],
            SHORTLISTED: ['INTERVIEW', 'REJECTED'],
            INTERVIEW: ['ACCEPTED', 'REJECTED'],
            ACCEPTED: [],
            REJECTED: [],
        });
    });

    it('only points at statuses that have a label', () => {
        for (const next of Object.values(RESUME_NEXT).flat()) {
            expect(RESUME_STATUS[next]).toBeDefined();
        }
    });
});

describe('timeAgo', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('counts days, weeks, months and years', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-05T12:00:00Z'));
        const ago = (days: number) => new Date(Date.now() - days * DAY);

        expect(timeAgo(ago(0.2))).toBe('hôm nay');
        expect(timeAgo(ago(3))).toBe('3 ngày trước');
        expect(timeAgo(ago(14))).toBe('2 tuần trước');
        expect(timeAgo(ago(45))).toBe('1 tháng trước');
        expect(timeAgo(ago(400))).toBe('1 năm trước');
        expect(timeAgo('not a date')).toBeNull();
    });
});
