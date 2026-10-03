import { BsShieldFillCheck } from 'react-icons/bs';
import d from '@/styles/detail.module.scss';

// Companies are only public once an admin has approved them, so `approved` doubles as "verified".
const VerifiedBadge = ({ approved }: { approved?: boolean }) =>
    approved ? (
        <span
            className={d.verified}
            role="img"
            aria-label="Nhà tuyển dụng đã được xác minh"
            title="Nhà tuyển dụng đã được xác minh"
        >
            <BsShieldFillCheck aria-hidden="true" />
        </span>
    ) : null;

export default VerifiedBadge;
