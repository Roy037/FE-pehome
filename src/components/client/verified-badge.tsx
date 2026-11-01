import { SealCheck as PiSealCheck } from '@phosphor-icons/react';
import d from '@/styles/detail.module.scss';

const VerifiedBadge = ({ approved }: { approved?: boolean }) =>
    approved ? (
        <span
            className={d.verified}
            role="img"
            aria-label="Nhà tuyển dụng đã được xác minh"
            title="Nhà tuyển dụng đã được xác minh"
        >
            <PiSealCheck weight="fill" aria-hidden="true" />
        </span>
    ) : null;

export default VerifiedBadge;
