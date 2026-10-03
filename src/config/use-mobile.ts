import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

// Follows the viewport width (and rotation), unlike user-agent sniffing which never changes after load.
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
