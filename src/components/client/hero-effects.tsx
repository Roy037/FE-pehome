import { RefObject, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/config/motion';
import styles from '@/styles/client.module.scss';

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export const burstSparkles = (element: Element, count = 10) => {
    const rect = element.getBoundingClientRect();
    window.dispatchEvent(
        new CustomEvent('pc-sparkle-burst', {
            detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count },
        }),
    );
};

export const usePointerDepth = (ref: RefObject<HTMLElement>) => {
    const reduced = useReducedMotion();
    useEffect(() => {
        const el = ref.current;
        if (!el || reduced || !finePointer()) return;
        const target = { mx: 0, my: 0, gx: el.clientWidth * 0.7, gy: el.clientHeight * 0.35, glow: 0 };
        const current = { ...target };
        let frame = 0;
        let visible = false;
        let lastTime = 0;
        const reset = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            target.mx = target.my = target.glow = 0;
            Object.assign(current, target);
            ['--mx', '--my', '--gx', '--gy', '--glow'].forEach(name => el.style.removeProperty(name));
        };
        const tick = (now: number) => {
            if (!visible || document.hidden) {
                reset();
                return;
            }
            const blend = 1 - Math.exp(-Math.min(now - lastTime, 64) / 180);
            lastTime = now;
            let moving = false;
            (Object.keys(target) as (keyof typeof target)[]).forEach(key => {
                const delta = target[key] - current[key];
                current[key] += delta * blend;
                if (Math.abs(delta) > 0.001) moving = true;
            });
            el.style.setProperty('--mx', current.mx.toFixed(4));
            el.style.setProperty('--my', current.my.toFixed(4));
            el.style.setProperty('--gx', `${current.gx.toFixed(1)}px`);
            el.style.setProperty('--gy', `${current.gy.toFixed(1)}px`);
            el.style.setProperty('--glow', current.glow.toFixed(3));
            frame = moving ? requestAnimationFrame(tick) : 0;
        };
        const kick = () => {
            if (!frame && visible && !document.hidden) {
                lastTime = performance.now();
                frame = requestAnimationFrame(tick);
            }
        };
        const move = (event: PointerEvent) => {
            if (!visible || document.hidden) return;
            const rect = el.getBoundingClientRect();
            target.gx = event.clientX - rect.left;
            target.gy = event.clientY - rect.top;
            target.mx = (target.gx / rect.width) * 2 - 1;
            target.my = (target.gy / rect.height) * 2 - 1;
            target.glow = 1;
            kick();
        };
        const leave = () => {
            target.mx = 0;
            target.my = 0;
            target.glow = 0;
            kick();
        };
        const onVisibility = () => {
            if (!visible || document.hidden) reset();
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            onVisibility();
        });
        observer.observe(el);
        document.addEventListener('visibilitychange', onVisibility);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
        return () => {
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerleave', leave);
            document.removeEventListener('visibilitychange', onVisibility);
            observer.disconnect();
            reset();
        };
    }, [ref, reduced]);
};

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    size: number;
    rot: number;
    spin: number;
    color: string;
}
const COLORS = ['#E3763C', '#FFD76A', '#FFB870', '#FFFFFF'];
const MAX_PARTICLES = 40;

export const SparkleField = ({ containerRef }: { containerRef: RefObject<HTMLElement> }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reduced = useReducedMotion();

    useEffect(() => {
        const host = containerRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!host || !canvas || !ctx || reduced) return;

        const particles: Particle[] = [];
        let frame = 0;
        let visible = false;
        let ambient = 0;
        let lastTime = performance.now();

        const resize = () => {
            if (!visible || document.hidden) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = host.clientWidth * dpr;
            canvas.height = host.clientHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        const spawn = (clientX: number, clientY: number, count: number, speed: number) => {
            if (!visible || document.hidden) return;
            const rect = canvas.getBoundingClientRect();
            for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = speed * (0.4 + Math.random() * 0.8);
                particles.push({
                    x: clientX - rect.left,
                    y: clientY - rect.top,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity - speed * 0.35,
                    life: 0,
                    max: 650 + Math.random() * 450,
                    size: 2 + Math.random() * 3,
                    rot: Math.random() * Math.PI,
                    spin: (Math.random() - 0.5) * 0.002,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                });
            }
            if (!frame && visible) {
                lastTime = performance.now();
                frame = requestAnimationFrame(draw);
            }
        };
        const star = (p: Particle, alpha: number) => {
            const r = p.size * (1 - (p.life / p.max) * 0.6);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = alpha * 0.55;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.quadraticCurveTo(0, 0, 0, r);
            ctx.quadraticCurveTo(0, 0, -r, 0);
            ctx.quadraticCurveTo(0, 0, 0, -r);
            ctx.fill();
            ctx.restore();
        };
        const draw = (now: number) => {
            if (!visible || document.hidden) {
                stop();
                return;
            }
            const dt = Math.min(now - lastTime, 50);
            lastTime = now;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life += dt;
                if (p.life >= p.max) {
                    particles.splice(i, 1);
                    continue;
                }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 0.00006 * dt;
                p.rot += p.spin * dt;
                const t = p.life / p.max;
                star(p, t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85);
            }
            frame = particles.length && visible ? requestAnimationFrame(draw) : 0;
        };

        const onBurst = (event: Event) => {
            const { x, y, count } = (event as CustomEvent<{ x: number; y: number; count: number }>).detail;
            spawn(x, y, Math.min(count, 10), 0.1);
        };
        const emitAmbient = () => {
            if (!visible || document.hidden) return;
            const nodes = host.querySelectorAll('[data-sparkle]');
            if (!nodes.length) return;
            const rect = nodes[Math.floor(Math.random() * nodes.length)].getBoundingClientRect();
            spawn(
                rect.left + rect.width * (0.2 + Math.random() * 0.6),
                rect.top + rect.height * (0.2 + Math.random() * 0.6),
                1,
                0.025,
            );
        };
        const stop = () => {
            cancelAnimationFrame(frame);
            window.clearInterval(ambient);
            frame = ambient = 0;
            particles.length = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        const syncActivity = () => {
            if (!visible || document.hidden) {
                stop();
                return;
            }
            resize();
            if (!ambient) ambient = window.setInterval(emitAmbient, 1200);
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            syncActivity();
        });
        const resizeObserver = new ResizeObserver(resize);

        observer.observe(host);
        resizeObserver.observe(host);
        window.addEventListener('pc-sparkle-burst', onBurst);
        document.addEventListener('visibilitychange', syncActivity);
        return () => {
            stop();
            observer.disconnect();
            resizeObserver.disconnect();
            window.removeEventListener('pc-sparkle-burst', onBurst);
            document.removeEventListener('visibilitychange', syncActivity);
        };
    }, [containerRef, reduced]);

    return <canvas ref={canvasRef} className={styles.sparkleCanvas} aria-hidden="true" />;
};
