import { CSSProperties, KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useReducedMotion } from '@/config/motion';
import styles from '@/styles/client.module.scss';

interface IProps<T> {
    items: T[];
    label: string;
    itemLabel: (item: T) => string;
    render: (item: T, active: boolean) => ReactNode;
    autoPlay?: number;
    className?: string;
}

// One focused card in the middle; neighbours recede (smaller, blurred) and are inert until selected.
const Coverflow = <T,>({ items, label, itemLabel, render, autoPlay = 5000, className }: IProps<T>) => {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const reduced = useReducedMotion();
    const slides = useRef<(HTMLDivElement | null)[]>([]);
    const count = items.length;
    const go = (step: number) => setActive(value => (value + step + count) % count);

    useEffect(() => {
        slides.current.forEach((el, index) => el?.toggleAttribute('inert', index !== active));
    }, [active, count]);

    useEffect(() => {
        if (!autoPlay || paused || reduced || count < 2) return;
        const timer = window.setInterval(() => {
            if (!document.hidden) go(1);
        }, autoPlay);
        return () => window.clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, paused, reduced, count]);

    const onKey = (event: KeyboardEvent) => {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(1);
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(-1);
        }
    };

    return (
        <div
            className={`${styles.coverflow} ${className ?? ''}`}
            role="region"
            aria-roledescription="carousel"
            aria-label={label}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onKeyDown={onKey}
        >
            <button type="button" className={styles.coverflowPrev} onClick={() => go(-1)} aria-label="Việc làm trước">
                <ArrowLeftOutlined />
            </button>
            <div className={styles.coverflowStage}>
                {items.map((item, index) => {
                    // Shortest signed distance around the loop, so the stack wraps smoothly.
                    let offset = index - active;
                    if (offset > count / 2) offset -= count;
                    if (offset < -count / 2) offset += count;
                    const distance = Math.abs(offset);
                    return (
                        <div
                            key={index}
                            ref={el => {
                                slides.current[index] = el;
                            }}
                            className={`${styles.coverflowSlide} ${distance > 2 ? styles.coverflowHidden : ''}`}
                            style={{ '--offset': offset, '--distance': distance } as CSSProperties}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${index + 1} / ${count}: ${itemLabel(item)}`}
                            aria-hidden={offset !== 0 || undefined}
                            onClick={offset !== 0 ? () => setActive(index) : undefined}
                        >
                            {render(item, offset === 0)}
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                className={styles.coverflowNext}
                onClick={() => go(1)}
                aria-label="Việc làm tiếp theo"
            >
                <ArrowRightOutlined />
            </button>
            <p className="sr-only" aria-live="polite">
                {count ? `Đang xem ${active + 1} / ${count}: ${itemLabel(items[active])}` : ''}
            </p>
        </div>
    );
};

export default Coverflow;
