import { createElement } from 'react';
import parse, { DOMNode, domToReact, Element, HTMLReactParserOptions } from 'html-react-parser';

const allowedTags = new Set([
    'p',
    'br',
    'div',
    'span',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'a',
    'hr',
    'pre',
    'code',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
]);

const safeUrl = (value: string, protocols: string[]) => {
    try {
        return protocols.includes(new URL(value, 'https://polycareers.invalid').protocol) ? value : undefined;
    } catch {
        return undefined;
    }
};

const options: HTMLReactParserOptions = {
    replace(node) {
        if (!(node instanceof Element)) return;
        if (!allowedTags.has(node.name)) return <></>;
        if (node.name === 'img') {
            const src = safeUrl(node.attribs.src || '', ['http:', 'https:']);
            return src ? (
                <img src={src} alt={node.attribs.alt || 'Hình ảnh trong thông tin tuyển dụng'} loading="lazy" />
            ) : (
                <></>
            );
        }
        const attributes: Record<string, string | undefined> =
            node.name === 'a'
                ? {
                      href: safeUrl(node.attribs.href || '', ['http:', 'https:', 'mailto:', 'tel:']),
                      target: '_blank',
                      rel: 'noopener noreferrer',
                  }
                : {};
        const tag = ['h1', 'h2'].includes(node.name) ? 'h3' : node.name;
        // Rebuild only known elements; discard all untrusted styling and event attributes.
        return createElement(
            tag,
            attributes,
            ...(['br', 'hr'].includes(tag) ? [] : [domToReact(node.children as DOMNode[], options)]),
        );
    },
};

const RichDescription = ({ html }: { html: string }) =>
    html.trim() ? <>{parse(html, options)}</> : <p>Nhà tuyển dụng chưa cập nhật nội dung này.</p>;

export default RichDescription;
