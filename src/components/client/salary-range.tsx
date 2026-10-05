import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { SALARY_MAX_M } from '@/config/utils';
import d from '@/styles/discovery.module.scss';

const TICKS = 50;
const clamp = (value: number) => Math.min(SALARY_MAX_M, Math.max(0, Math.round(value)));

interface IProps {
    min: number;
    max: number;
    withNegotiable: boolean;
    onCommit: (min: number, max: number, withNegotiable: boolean) => void;
}

const SalaryRange = ({ min, max, withNegotiable, onCommit }: IProps) => {
    const [lo, setLo] = useState(min);
    const [hi, setHi] = useState(max);
    const [boxes, setBoxes] = useState<{ lo: string; hi: string } | null>(null);
    const track = useRef<HTMLDivElement>(null);
    const dragging = useRef<'lo' | 'hi' | null>(null);

    useEffect(() => {
        setLo(min);
        setHi(max);
    }, [min, max]);

    const valueAt = (clientX: number) => {
        const box = track.current!.getBoundingClientRect();
        return clamp(((clientX - box.left) / box.width) * SALARY_MAX_M);
    };

    const start = (which: 'lo' | 'hi') => (event: PointerEvent<HTMLElement>) => {
        event.stopPropagation();
        dragging.current = which;
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
        if (!dragging.current) return;
        const value = valueAt(event.clientX);
        if (dragging.current === 'lo') setLo(Math.min(value, hi));
        else setHi(Math.max(value, lo));
    };
    const stop = () => {
        if (!dragging.current) return;
        dragging.current = null;
        onCommit(lo, hi, withNegotiable);
    };
    const jump = (event: PointerEvent<HTMLDivElement>) => {
        const value = valueAt(event.clientX);
        if (Math.abs(value - lo) <= Math.abs(value - hi)) {
            setLo(Math.min(value, hi));
            onCommit(Math.min(value, hi), hi, withNegotiable);
        } else {
            setHi(Math.max(value, lo));
            onCommit(lo, Math.max(value, lo), withNegotiable);
        }
    };
    const keys = (which: 'lo' | 'hi') => (event: KeyboardEvent) => {
        const step =
            event.key === 'PageUp'
                ? 10
                : event.key === 'PageDown'
                  ? -10
                  : event.key === 'ArrowRight' || event.key === 'ArrowUp'
                    ? 1
                    : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                      ? -1
                      : 0;
        const edge = event.key === 'Home' ? 0 : event.key === 'End' ? SALARY_MAX_M : null;
        if (!step && edge === null) return;
        event.preventDefault();
        const next = clamp(edge ?? (which === 'lo' ? lo : hi) + step);
        const [a, b] = which === 'lo' ? [Math.min(next, hi), hi] : [lo, Math.max(next, lo)];
        setLo(a);
        setHi(b);
        onCommit(a, b, withNegotiable);
    };

    const commitBoxes = () => {
        if (!boxes) return;
        const a = boxes.lo === '' ? 0 : clamp(Number(boxes.lo.replace(/\D/g, '')));
        const b = boxes.hi === '' || /\+/.test(boxes.hi) ? SALARY_MAX_M : clamp(Number(boxes.hi.replace(/\D/g, '')));
        setBoxes(null);
        const [low, high] = a <= b ? [a, b] : [b, a];
        setLo(low);
        setHi(high);
        onCommit(low, high, withNegotiable);
    };

    const pct = (value: number) => `${(value / SALARY_MAX_M) * 100}%`;
    const narrowed = lo > 0 || hi < SALARY_MAX_M;
    const handle = (which: 'lo' | 'hi', value: number, label: string, from: number, to: number) => (
        <button
            type="button"
            role="slider"
            aria-label={label}
            aria-valuemin={from}
            aria-valuemax={to}
            aria-valuenow={value}
            aria-valuetext={value >= SALARY_MAX_M && which === 'hi' ? '100 triệu trở lên' : `${value} triệu`}
            className={d.salaryHandle}
            style={{ left: pct(value) }}
            onPointerDown={start(which)}
            onPointerMove={move}
            onPointerUp={stop}
            onPointerCancel={stop}
            onKeyDown={keys(which)}
        />
    );

    return (
        <div className={d.salary}>
            <div className={d.salaryTrack} ref={track} onPointerDown={jump}>
                <div className={d.salaryTicks} aria-hidden="true">
                    {Array.from({ length: TICKS + 1 }, (_, index) => {
                        const at = (index / TICKS) * SALARY_MAX_M;
                        return <i key={index} className={at >= lo && at <= hi ? d.salaryTickOn : undefined} />;
                    })}
                </div>
                <div className={d.salaryLine}>
                    <span style={{ left: pct(lo), width: `${((hi - lo) / SALARY_MAX_M) * 100}%` }} />
                </div>
                {handle('lo', lo, 'Lương tối thiểu (triệu đồng)', 0, hi)}
                {handle('hi', hi, 'Lương tối đa (triệu đồng)', lo, SALARY_MAX_M)}
            </div>
            <div className={d.salaryBoxes}>
                <label>
                    <span className="sr-only">Từ (triệu đồng)</span>
                    <input
                        inputMode="numeric"
                        value={boxes?.lo ?? String(lo)}
                        onChange={event =>
                            setBoxes({
                                lo: event.target.value,
                                hi: boxes?.hi ?? (hi >= SALARY_MAX_M ? `${hi}+` : String(hi)),
                            })
                        }
                        onBlur={commitBoxes}
                        onKeyDown={event => event.key === 'Enter' && commitBoxes()}
                        onFocus={event => event.target.select()}
                    />
                </label>
                <span aria-hidden="true">–</span>
                <label>
                    <span className="sr-only">Đến (triệu đồng)</span>
                    <input
                        inputMode="numeric"
                        value={boxes?.hi ?? (hi >= SALARY_MAX_M ? `${hi}+` : String(hi))}
                        onChange={event => setBoxes({ lo: boxes?.lo ?? String(lo), hi: event.target.value })}
                        onBlur={commitBoxes}
                        onKeyDown={event => event.key === 'Enter' && commitBoxes()}
                        onFocus={event => event.target.select()}
                    />
                </label>
                <em>triệu đ</em>
            </div>
            {narrowed && (
                <label className={d.salaryDeal}>
                    <input
                        type="checkbox"
                        checked={withNegotiable}
                        onChange={event => onCommit(lo, hi, event.target.checked)}
                    />{' '}
                    Gồm cả tin lương thỏa thuận
                </label>
            )}
        </div>
    );
};

export default SalaryRange;
