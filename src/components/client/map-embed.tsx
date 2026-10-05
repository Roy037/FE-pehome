import d from '@/styles/detail.module.scss';

const GOOGLE_EMBED = /^https:\/\/(www\.google\.com\/maps\/embed(\/v1\/\w+)?\?|maps\.google\.com\/maps\?)[^\s"'<>]+$/;

export const isMapEmbedUrl = (url?: string): url is string =>
    Boolean(url && url.length <= 1000 && GOOGLE_EMBED.test(url));

const MapEmbed = ({ url, title }: { url?: string; title: string }) =>
    isMapEmbedUrl(url) ? (
        <iframe
            className={d.mapFrame}
            src={url}
            title={title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
    ) : null;

export default MapEmbed;
