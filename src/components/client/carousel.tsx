import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined, CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import { useReducedMotion } from '@/config/motion';
import styles from '@/styles/client.module.scss';

interface IProps {
    label: string;
    className?: string;
    autoPlay?: number;
    intro?: ReactNode;
    children: ReactNode;
}

const MAX_DOTS = 8;

const Carousel = ({ label, className, autoPlay, intro, children }: IProps) => {
    const track = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(0);
    const [pages, setPages] = useState(1);
    const [hovered, setHovered] = useState(false);
    const reduced = useReducedMotion();
    const [stopped, setStopped] = useState(false);

    const measure = useCallback(() => {
        const el = track.current;
        if (!el || !el.clientWidth) return;
        setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth)));
        setPage(
            el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
                ? Math.round(el.scrollWidth / el.clientWidth) - 1
                : Math.round(el.scrollLeft / el.clientWidth),
        );
    }, []);

    useEffect(() => {
        measure();
        const observer = new ResizeObserver(measure);
        if (track.current) observer.observe(track.current);
        return () => observer.disconnect();
    }, [measure, children]);

    const scrollTo = (index: number) => {
        const el = track.current;
        if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    };

    useEffect(() => {
        if (!autoPlay || pages <= 1 || hovered || stopped || reduced) return;
        const timer = window.setInterval(() => {
            const el = track.current;
            if (!el || document.hidden) return;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
            el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth, behavior: 'smooth' });
        }, autoPlay);
        return () => window.clearInterval(timer);
    }, [autoPlay, pages, hovered, stopped, reduced]);

    return (
        <div
            className={`${styles.carousel} ${className ?? ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
            {intro}
            <div
                ref={track}
                className={styles.carouselTrack}
                onScroll={measure}
                role="region"
                aria-label={label}
                tabIndex={0}
            >
                {children}
            </div>
            {pages > 1 && (
                <div className={styles.carouselNav} data-carousel-controls>
                    <button
                        type="button"
                        onClick={() => scrollTo(page - 1)}
                        disabled={page === 0}
                        aria-label="Xem mục trước"
                    >
                        <ArrowLeftOutlined />
                    </button>
                    {pages > MAX_DOTS ? (
                        <span className={styles.pageCount} aria-hidden="true">
                            {page + 1} / {pages}
                        </span>
                    ) : (
                        <div className={styles.dots}>
                            {Array.from({ length: pages }, (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={index === page ? styles.dotActive : undefined}
                                    onClick={() => scrollTo(index)}
                                    aria-label={`Trang ${index + 1}`}
                                    aria-current={index === page}
                                />
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => scrollTo(page + 1)}
                        disabled={page >= pages - 1}
                        aria-label="Xem mục tiếp theo"
                    >
                        <ArrowRightOutlined />
                    </button>
                    {autoPlay && !reduced && (
                        <button
                            type="button"
                            className={styles.carouselToggle}
                            onClick={() => setStopped(value => !value)}
                            aria-label={stopped ? 'Tự động chuyển trang' : 'Dừng tự động chuyển trang'}
                            aria-pressed={!stopped}
                        >
                            {stopped ? <CaretRightOutlined /> : <PauseOutlined />}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Carousel;
