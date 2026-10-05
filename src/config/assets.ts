const FALLBACK_PHOTO = '/images/career-workspace.webp';

export const ASSETS = {
    hero: { src: '/images/hero-woman.webp', fallback: FALLBACK_PHOTO },
    banner: { src: '/images/detail-banner.webp', fallback: FALLBACK_PHOTO },
    auth: { src: '/images/auth-portrait.webp', fallback: FALLBACK_PHOTO },
    newsletter: { src: '/images/newsletter.webp', fallback: FALLBACK_PHOTO },
    explorerLeft: { src: '/images/illustration-explorer-left.webp' },
    explorerRight: { src: '/images/illustration-explorer-right.webp' },
    newsletterLeft: { src: '/images/illustration-newsletter-left.webp' },
    newsletterRight: { src: '/images/illustration-newsletter-right.webp' },
    testimonialCandidate: { src: '/images/illustration-candidate.webp' },
    testimonialEmployer: { src: '/images/illustration-employer.webp' },
    blob: { src: '/images/decor-blob.webp' },
};

export const bannerBackground = `url(${ASSETS.banner.src}), url(${ASSETS.banner.fallback})`;
