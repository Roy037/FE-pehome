import { CSSProperties, useEffect, useState } from 'react';
import { convertSlug } from '@/config/utils';
import styles from '@/styles/client.module.scss';

interface IProps {
    name?: string;
    logo?: string;
    size?: number;
    className?: string;
}

// Tries the admin-uploaded logo, then the bundled /logos/<slug>.webp, then falls back to initials.
export const logoSources = (name?: string, logo?: string) =>
    [
        logo ? `${import.meta.env.VITE_BACKEND_URL}/storage/company/${logo}` : '',
        name ? `/logos/${convertSlug(name)}.webp` : '',
    ].filter(Boolean);

const CompanyLogo = ({ name, logo, size = 48, className }: IProps) => {
    const sources = logoSources(name, logo);
    const key = sources.join('|');
    const [index, setIndex] = useState(0);
    useEffect(() => setIndex(0), [key]);
    const source = sources[index];
    const initials = (name || 'Poly Careers')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();

    return (
        <span
            className={`${styles.companyLogo} ${className ?? ''}`}
            style={{ '--logo-size': `${size}px` } as CSSProperties}
        >
            {source ? (
                <img
                    src={source}
                    alt={`Logo ${name || 'công ty'}`}
                    loading="lazy"
                    data-bundled={source.startsWith('/logos/') || undefined}
                    onError={() => setIndex(value => value + 1)}
                />
            ) : (
                <span role="img" aria-label={`Logo ${name || 'công ty'}`}>
                    {initials}
                </span>
            )}
        </span>
    );
};

export default CompanyLogo;
