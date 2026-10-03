import { ImgHTMLAttributes, MouseEvent, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpOutlined } from '@ant-design/icons';
import { burstSparkles } from './hero-effects';
import styles from '@/styles/client.module.scss';

interface AssetProps extends ImgHTMLAttributes<HTMLImageElement> {
    asset: { src: string; fallback?: string };
}

// Shows the generated asset when present, else its fallback; decorative assets without one just disappear.
export const AssetImage = ({ asset, alt = '', ...rest }: AssetProps) => {
    const [state, setState] = useState<'primary' | 'fallback' | 'hidden'>('primary');
    const [loaded, setLoaded] = useState(false);
    if (state === 'hidden') return null;
    return (
        <img
            decoding="async"
            {...rest}
            alt={alt}
            src={state === 'primary' ? asset.src : asset.fallback}
            data-loaded={loaded || undefined}
            onLoad={() => setLoaded(true)}
            onError={() => setState(state === 'primary' && asset.fallback ? 'fallback' : 'hidden')}
        />
    );
};

export const Sparkle = ({ className, emit }: { className?: string; emit?: boolean }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" data-sparkle={emit || undefined}>
        <path
            d="M12 0c.7 6.4 5.6 11.3 12 12-6.4.7-11.3 5.6-12 12-.7-6.4-5.6-11.3-12-12C6.4 11.3 11.3 6.4 12 0Z"
            fill="currentColor"
        />
    </svg>
);

interface BadgeProps {
    text: string;
    to?: string;
    label?: string;
    className?: string;
    glass?: boolean;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
}

// Without `to` the badge is purely decorative. `glass` renders the liquid-glass variant that emits sparkles.
export const RotatingBadge = ({ text, to, label, className, glass, onClick }: BadgeProps) => {
    const id = useId().replace(/:/g, '');
    const pathId = `badge-${id}`;
    const filterId = `glass-${id}`;
    const classes = `${styles.rotatingBadge} ${glass ? styles.rotatingBadgeGlass : ''} ${className ?? ''}`;
    const content = (
        <>
            {glass && (
                <>
                    <svg className={styles.glassDefs} aria-hidden="true">
                        <filter id={filterId} x="0" y="0" width="100%" height="100%">
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency="0.011 0.017"
                                numOctaves="2"
                                seed="11"
                                result="noise"
                            />
                            <feGaussianBlur in="noise" stdDeviation="2.4" result="soft" />
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="soft"
                                scale="46"
                                xChannelSelector="R"
                                yChannelSelector="G"
                            />
                        </filter>
                    </svg>
                    <span
                        className={styles.glassRefraction}
                        style={{ filter: `url(#${filterId})` }}
                        aria-hidden="true"
                    />
                </>
            )}
            <svg viewBox="0 0 120 120" aria-hidden="true" className={styles.badgeRing}>
                <defs>
                    <path id={pathId} d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
                </defs>
                <text>
                    <textPath href={`#${pathId}`} textLength="280" lengthAdjust="spacing">
                        {text}
                    </textPath>
                </text>
            </svg>
            <span className={styles.badgeIcon}>
                <ArrowUpOutlined rotate={45} />
            </span>
        </>
    );
    const glassProps = glass
        ? {
              'data-sparkle': true,
              onMouseEnter: (event: MouseEvent<HTMLElement>) => burstSparkles(event.currentTarget, 16),
          }
        : {};
    const handleClick = (event: MouseEvent<HTMLElement>) => {
        if (glass) burstSparkles(event.currentTarget, 26);
        onClick?.(event);
    };
    return to ? (
        <Link className={classes} to={to} aria-label={label} {...glassProps} onClick={handleClick}>
            {content}
        </Link>
    ) : (
        <span className={classes} aria-hidden="true" {...glassProps} onClick={handleClick}>
            {content}
        </span>
    );
};

export const Brand = ({ className }: { className?: string }) => (
    <Link to="/" className={`${styles.brand} ${className ?? ''}`} aria-label="itjobs — Trang chủ">
        <img src="/logos/itjobs.svg" alt="itjobs" width="148" height="49" />
    </Link>
);

interface StateProps {
    icon: React.ReactNode;
    title: string;
    text?: string;
    action?: React.ReactNode;
    compact?: boolean;
}

export const StatePanel = ({ icon, title, text, action, compact }: StateProps) => (
    <div className={`${styles.statePanel} ${compact ? styles.statePanelCompact : ''}`} role="status">
        <span className={styles.stateIcon}>{icon}</span>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {action}
    </div>
);
