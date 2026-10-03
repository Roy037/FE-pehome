import { CSSProperties, memo } from 'react';
import { Link } from 'react-router-dom';
import { EnvironmentOutlined, WalletOutlined } from '@ant-design/icons';
import { IJob } from '@/types/backend';
import {
    EMPLOYMENT_TYPE_LIST,
    LEVEL_LIST,
    WORK_MODE_LIST,
    formatDate,
    formatSalary,
    getCityName,
    jobPath,
    labelOf,
} from '@/config/utils';
import CompanyLogo from './company-logo';
import SaveJobButton from '../save-job.button';
import styles from '@/styles/client.module.scss';

export const jobTags = (job: IJob) =>
    [labelOf(EMPLOYMENT_TYPE_LIST, job.employmentType), labelOf(WORK_MODE_LIST, job.workMode)].filter(
        Boolean,
    ) as string[];

interface CardProps {
    job: IJob;
    featured?: boolean;
}

export const JobCard = memo(({ job, featured }: CardProps) => {
    const tags = [...jobTags(job), labelOf(LEVEL_LIST, job.level)].filter(Boolean);
    return (
        <article className={`${styles.jobCard} ${featured ? styles.jobCardFeatured : ''}`}>
            <div className={styles.jobCardHead}>
                <CompanyLogo
                    name={job.company?.name}
                    logo={job.company?.logo}
                    size={48}
                    className={styles.jobCardLogo}
                />
                <div className={styles.jobCardTitle}>
                    <h3>
                        <Link className={styles.stretchedLink} to={jobPath(job)}>
                            {job.name}
                        </Link>
                    </h3>
                    <p>{job.company?.name || 'Nhà tuyển dụng'}</p>
                </div>
                <SaveJobButton jobId={job.id} jobName={job.name} />
            </div>
            {tags.length > 0 && (
                <div className={styles.tags}>
                    {tags.map(tag => (
                        <span key={tag} className={styles.tag}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            <ul className={styles.jobCardMeta}>
                <li>
                    <EnvironmentOutlined aria-hidden="true" />
                    {getCityName(job.location)}
                </li>
                <li>
                    <WalletOutlined aria-hidden="true" />
                    {formatSalary(job.salary, job.salaryMax, true)}
                </li>
            </ul>
            <span className={styles.cardCta} aria-hidden="true">
                Xem chi tiết
            </span>
        </article>
    );
});

export const MiniJob = ({ job, showCompany = true }: { job: IJob; showCompany?: boolean }) => (
    <li className={styles.miniJob}>
        <Link to={jobPath(job)}>
            <strong>{job.name}</strong>
            {showCompany && <span>{job.company?.name}</span>}
            <span className={styles.miniJobMeta}>
                <span>
                    <EnvironmentOutlined aria-hidden="true" /> {getCityName(job.location)}
                </span>
                <span>
                    <WalletOutlined aria-hidden="true" /> {formatSalary(job.salary, job.salaryMax, true)}
                </span>
            </span>
        </Link>
    </li>
);

export const JobRow = memo(({ job, index }: { job: IJob; index?: number }) => {
    const tags = jobTags(job);
    const posted = formatDate(job.createdAt);
    const deadline = formatDate(job.endDate);
    return (
        <article
            className={`${styles.jobRow} ${index === undefined ? '' : 'reveal'}`}
            style={index === undefined ? undefined : ({ '--i': index % 4 } as CSSProperties)}
        >
            <CompanyLogo name={job.company?.name} logo={job.company?.logo} size={64} className={styles.jobRowLogo} />
            <div className={styles.jobRowMain}>
                <div className={styles.jobRowTitle}>
                    <h3>
                        <Link className={styles.stretchedLink} to={jobPath(job)}>
                            {job.name}
                        </Link>
                    </h3>
                    {tags.map(tag => (
                        <span key={tag} className={styles.tagSquare}>
                            {tag}
                        </span>
                    ))}
                </div>
                <p className={styles.jobRowCompany}>
                    {job.company?.name || 'Nhà tuyển dụng'}
                    {job.level ? ` · ${labelOf(LEVEL_LIST, job.level)}` : ''}
                </p>
                <ul className={styles.jobRowMeta}>
                    <li>
                        <EnvironmentOutlined aria-hidden="true" />
                        {getCityName(job.location)}
                    </li>
                    <li>
                        <WalletOutlined aria-hidden="true" />
                        {formatSalary(job.salary, job.salaryMax, true)}
                    </li>
                </ul>
            </div>
            <div className={styles.jobRowSide}>
                {posted && <span>Đăng ngày: {posted}</span>}
                {deadline && <span>Hạn nộp: {deadline}</span>}
                <div className={styles.jobRowActions}>
                    <SaveJobButton jobId={job.id} jobName={job.name} />
                    <span className={styles.btnPrimarySm} aria-hidden="true">
                        Xem chi tiết
                    </span>
                </div>
            </div>
        </article>
    );
});
