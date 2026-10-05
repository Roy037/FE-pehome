import { ReactNode, useEffect, useState } from 'react';
import { Button, Input, Modal, QRCode, message } from 'antd';
import {
    EnvelopeSimple as PiEnvelopeSimple,
    FacebookLogo as PiFacebookLogo,
    LinkedinLogo as PiLinkedinLogo,
    MessengerLogo as PiMessengerLogo,
    ShareNetwork as PiShareNetwork,
    XLogo as PiXLogo,
} from '@phosphor-icons/react';
import { SiZalo } from 'react-icons/si';
import CompanyLogo from '@/components/client/card/company-logo';
import { useIsMobile } from '@/config/use-mobile';
import s from '@/styles/share.module.scss';

interface IProps {
    open: boolean;
    onClose: () => void;
    kind: 'job' | 'company';
    id?: string | number;
    title: string;
    /** the company behind the post, shown on the preview card */
    company?: { name?: string; logo?: string };
    /** short facts under the title on the preview card, e.g. salary and city */
    facts?: string[];
    /** the ready-made post text; the person can edit it before sharing */
    message: string;
}

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
const enc = encodeURIComponent;

// The address the backend answers with the page's own preview card, then sends people on to the site.
const shareAddress = (kind: IProps['kind'], id?: string | number) => {
    const backend = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '');
    return backend && id !== undefined ? `${backend}/share/${kind}/${id}` : window.location.href;
};

const copy = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

interface Channel {
    key: string;
    label: string;
    icon: ReactNode;
    href?: string;
    onClick?: () => void;
}

const ShareModal = ({ open, onClose, kind, id, title, company, facts = [], message: template }: IProps) => {
    const mobile = useIsMobile();
    const url = shareAddress(kind, id);
    const [text, setText] = useState(template);
    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    useEffect(() => {
        if (open) setText(template);
    }, [open, template]);

    const copyLink = async () => {
        if (await copy(url)) message.success('Đã sao chép liên kết.');
        else message.error('Chưa thể sao chép. Hãy chọn và sao chép liên kết trong ô.');
    };

    const copyMessage = async () => {
        if (await copy(`${text}\n${url}`)) message.success('Đã sao chép nội dung kèm liên kết.');
        else message.error('Chưa thể sao chép. Hãy chọn và sao chép nội dung trong ô.');
    };

    const nativeShare = async () => {
        try {
            await navigator.share({ title, text, url });
        } catch (error) {
            if ((error as DOMException)?.name !== 'AbortError') message.error('Chưa thể mở bảng chia sẻ của thiết bị.');
        }
    };

    // Zalo has no web share address without an official account: phones hand the link to the share sheet (pick Zalo
    // there), computers copy it and point at the QR code.
    const zalo = async () => {
        if (mobile && canNativeShare) return nativeShare();
        if (await copy(url)) message.success('Đã sao chép liên kết. Dán vào Zalo hoặc quét mã QR bên dưới.');
        else message.error('Chưa thể sao chép. Hãy chọn và sao chép liên kết trong ô.');
    };

    const channels: Channel[] = [
        {
            key: 'facebook',
            label: 'Facebook',
            icon: <PiFacebookLogo weight="fill" color="#1877F2" />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
        },
        { key: 'zalo', label: 'Zalo', icon: <SiZalo color="#0068FF" />, onClick: zalo },
        {
            key: 'linkedin',
            label: 'LinkedIn',
            icon: <PiLinkedinLogo weight="fill" color="#0A66C2" />,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
        },
        {
            key: 'x',
            label: 'X',
            icon: <PiXLogo weight="fill" />,
            href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`,
        },
        {
            key: 'email',
            label: 'Email',
            icon: <PiEnvelopeSimple weight="bold" />,
            href: `mailto:?subject=${enc(title)}&body=${enc(`${text}\n${url}`)}`,
        },
    ];
    // the Messenger share dialog on a computer needs the Facebook app id; phones open the app directly
    if (mobile) {
        channels.splice(2, 0, {
            key: 'messenger',
            label: 'Messenger',
            icon: <PiMessengerLogo weight="fill" color="#0084FF" />,
            href: `fb-messenger://share?link=${enc(url)}`,
        });
    } else if (FACEBOOK_APP_ID) {
        channels.splice(2, 0, {
            key: 'messenger',
            label: 'Messenger',
            icon: <PiMessengerLogo weight="fill" color="#0084FF" />,
            href: `https://www.facebook.com/dialog/send?app_id=${FACEBOOK_APP_ID}&link=${enc(url)}&redirect_uri=${enc(url)}`,
        });
    }
    if (canNativeShare) {
        channels.push({ key: 'more', label: 'Khác', icon: <PiShareNetwork weight="bold" />, onClick: nativeShare });
    }

    return (
        <Modal open={open} onCancel={onClose} footer={null} centered destroyOnClose width={420} title="Chia sẻ">
            <div className={s.card}>
                <CompanyLogo name={company?.name} logo={company?.logo} size={52} />
                <div className={s.cardText}>
                    <strong>{title}</strong>
                    {kind === 'job' && company?.name && <span>{company.name}</span>}
                    {facts.length > 0 && (
                        <span className={s.facts}>
                            {facts.map(fact => (
                                <em key={fact}>{fact}</em>
                            ))}
                        </span>
                    )}
                </div>
            </div>
            <label className={s.messageLabel} htmlFor="share-message">
                Nội dung chia sẻ
            </label>
            <Input.TextArea
                id="share-message"
                value={text}
                onChange={event => setText(event.target.value)}
                autoSize={{ minRows: 3, maxRows: 6 }}
                maxLength={500}
            />
            <div className={s.messageTools}>
                <span>
                    Facebook và LinkedIn lấy tiêu đề, ảnh từ liên kết nên không nhận sẵn nội dung. Dán vào khi đăng.
                </span>
                <button type="button" onClick={copyMessage}>
                    Sao chép nội dung
                </button>
            </div>
            <div className={s.grid}>
                {channels.map(channel => {
                    const content = (
                        <>
                            <span className={s.tile}>{channel.icon}</span>
                            <span className={s.label}>{channel.label}</span>
                        </>
                    );
                    return channel.href ? (
                        <a
                            key={channel.key}
                            className={s.channel}
                            href={channel.href}
                            target={channel.href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                        >
                            {content}
                        </a>
                    ) : (
                        <button key={channel.key} type="button" className={s.channel} onClick={channel.onClick}>
                            {content}
                        </button>
                    );
                })}
            </div>
            <div className={s.linkRow}>
                <Input readOnly value={url} onFocus={event => event.target.select()} aria-label="Liên kết chia sẻ" />
                <Button type="primary" onClick={copyLink}>
                    Sao chép
                </Button>
            </div>
            <div className={s.qr}>
                <QRCode value={url} size={144} type="svg" errorLevel="M" color="#1f1a16" />
                <span>Quét bằng Zalo hoặc camera điện thoại</span>
            </div>
        </Modal>
    );
};

export default ShareModal;
