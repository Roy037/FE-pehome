import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

export const useIsMobile = () => {
    const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches);
    useEffect(() => {
        const media = window.matchMedia(QUERY);
        const update = () => setMobile(media.matches);
        media.addEventListener('change', update);
        update();
        return () => media.removeEventListener('change', update);
    }, []);
    return mobile;
};
