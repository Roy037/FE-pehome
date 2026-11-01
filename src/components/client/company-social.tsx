import { FaFacebookF, FaInstagram, FaLinkedinIn, FaPinterestP, FaTwitter, FaYoutube } from 'react-icons/fa';
import { ICompany } from '@/types/backend';
import d from '@/styles/detail.module.scss';

const NETWORKS = [
    { key: 'facebookUrl', label: 'Facebook', Icon: FaFacebookF },
    { key: 'linkedinUrl', label: 'LinkedIn', Icon: FaLinkedinIn },
    { key: 'twitterUrl', label: 'Twitter', Icon: FaTwitter },
    { key: 'pinterestUrl', label: 'Pinterest', Icon: FaPinterestP },
    { key: 'instagramUrl', label: 'Instagram', Icon: FaInstagram },
    { key: 'youtubeUrl', label: 'YouTube', Icon: FaYoutube },
] as const;

const SocialLinks = ({ company }: { company?: Partial<ICompany> }) => {
    const links = NETWORKS.filter(({ key }) => company?.[key]?.startsWith('https://'));
    if (links.length === 0) return null;
    return (
        <div className={d.socialRow}>
            <span>Mạng xã hội:</span>
            <ul>
                {links.map(({ key, label, Icon }) => (
                    <li key={key}>
                        <a
                            href={company![key]}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            aria-label={`${label} của ${company?.name ?? 'công ty'}`}
                            title={label}
                        >
                            <Icon aria-hidden="true" />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SocialLinks;
