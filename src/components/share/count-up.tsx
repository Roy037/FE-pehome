import { useEffect, useRef, useState } from 'react';

interface IProps {
    end: number;
    start?: number;
    duration?: number;
    separator?: string;
    suffix?: string;
}

const group = (value: number, separator: string) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

const CountUp = ({ end, start = 0, duration = 1, separator = '', suffix = '' }: IProps) => {
    const [value, setValue] = useState(duration > 0 ? start : end);
    const shown = useRef(value);

    useEffect(() => {
        if (duration <= 0) {
            shown.current = end;
            setValue(end);
            return;
        }
        const from = shown.current;
        const began = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min((now - began) / (duration * 1000), 1);
            shown.current = Math.round(from + (end - from) * (1 - Math.pow(1 - progress, 3)));
            setValue(shown.current);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [end, duration]);

    return (
        <>
            {group(value, separator)}
            {suffix}
        </>
    );
};

export default CountUp;
