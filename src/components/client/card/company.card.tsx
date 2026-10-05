import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { ICompany } from '@/types/backend';
import { companyPath } from '@/config/utils';
import FollowCompanyButton from '../follow-company.button';
import CompanyLogo from './company-logo';
import styles from '@/styles/client.module.scss';

const CompanyCard = memo(({ company }: { company: ICompany }) => (
    <article className={styles.companyCard}>
        <CompanyLogo name={company.name} logo={company.logo} size={64} />
        <FollowCompanyButton
            companyId={company.id}
            companyName={company.name ?? 'nhà tuyển dụng'}
            className={styles.companyCardFollow}
        />
        <h3>
            <Link className={styles.stretchedLink} to={companyPath(company)}>
                {company.name || 'Nhà tuyển dụng'}
            </Link>
        </h3>
        <p>
            <EnvironmentOutlined aria-hidden="true" /> {company.address || 'Chưa cập nhật địa chỉ'}
        </p>
        <span className={styles.companyCardAction} aria-hidden="true">
            Xem công ty <ArrowRightOutlined />
        </span>
    </article>
));

export default CompanyCard;
