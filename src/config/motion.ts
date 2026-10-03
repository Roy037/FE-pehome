import { useEffect, useState } from 'react';

// Fall back to the OS preference when the page has no explicit motion override.
export const systemReducesMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const reducedMotion = () => {
    if (typeof document === 'undefined') return false;
    const pref = document.documentElement.dataset.motion;
    if (pref === 'on') return false;
    return systemReducesMotion();
};

export const useReducedMotion = () => {
    const [reduced, setReduced] = useState(reducedMotion);
    useEffect(() => {
        const update = () => setReduced(reducedMotion());
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return reduced;
};
