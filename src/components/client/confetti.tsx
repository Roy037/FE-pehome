import { CSSProperties, useMemo } from 'react';
import { useReducedMotion } from '@/config/motion';
import d from '@/styles/detail.module.scss';

const COLORS = ['#E3763C', '#F5C242', '#1D1712', '#F6C79E', '#2B8A3E', '#D94F4F'];
const PIECES = 36;

const Confetti = () => {
    const reduced = useReducedMotion();
    const pieces = useMemo(
        () =>
            Array.from({ length: PIECES }, (_, index) => {
                const angle = (Math.PI * 2 * index) / PIECES + (Math.random() - 0.5) * 0.5;
                const distance = 90 + Math.random() * 130;
                return {
                    '--x': `${Math.cos(angle) * distance}px`,
                    '--up': `${Math.sin(angle) * distance - 40}px`,
                    '--fall': `${Math.sin(angle) * distance + 90 + Math.random() * 60}px`,
                    '--spin': `${(Math.random() - 0.5) * 900}deg`,
                    '--c': COLORS[index % COLORS.length],
                    '--t': `${(0.9 + Math.random() * 0.6).toFixed(2)}s`,
                    '--w': `${(6 + Math.random() * 5).toFixed(1)}px`,
                } as CSSProperties;
            }),
        [],
    );

    if (reduced) return null;
    return (
        <div className={d.confetti} aria-hidden="true">
            {pieces.map((style, index) => (
                <i key={index} style={style} />
            ))}
        </div>
    );
};

export default Confetti;
