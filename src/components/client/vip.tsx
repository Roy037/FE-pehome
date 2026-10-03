import { ReactNode } from 'react';
import { Popover } from 'antd';
import s from '@/styles/client.module.scss';
import { useIsVip } from '@/redux/hooks';
import { useUpgradeModal } from './modal/upgrade.modal';

// itjobs paper plane (same shape as public/favicon.svg) in gold.
const PlaneMark = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M7 49 36 4 49 59 28 44Z" fill="#e2a21f" />
        <path d="M7 49 28 40 36 4Z" fill="#f7cf63" />
        <path d="M28 40 26 53 35 46Z" fill="#a8680f" />
        <path d="M28 40 36 4" fill="none" stroke="#fff3cf" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Gold plane next to a name. With `promo` it is a button: hovering explains the badge, clicking opens the plans.
export const VipBadge = ({ promo }: { promo?: boolean }) => {
    const isVip = useIsVip();
    const openUpgrade = useUpgradeModal();
    if (!promo) {
        return (
            <span className={s.vipBadge} role="img" aria-label="Thành viên VIP" title="Thành viên VIP">
                <PlaneMark />
            </span>
        );
    }
    return (
        <Popover
            placement="bottom"
            content={
                <div className={s.vipPromo}>
                    <strong>Huy hiệu Premium</strong>
                    <p>
                        {isVip
                            ? 'Bạn đang sở hữu huy hiệu này. Bấm để xem các gói.'
                            : 'Mua bất kỳ gói nào để nhận huy hiệu này. Bấm để xem các gói.'}
                    </p>
                </div>
            }
        >
            <button
                type="button"
                className={`${s.vipBadge} ${s.vipBadgeBtn}`}
                aria-label="Huy hiệu Premium, bấm để xem các gói"
                onClick={openUpgrade}
            >
                <PlaneMark />
            </button>
        </Popover>
    );
};

// Wraps an avatar: thin gold gradient ring around it and the gold plane on its lower-right corner when `vip` is true.
export const VipFrame = ({ vip, children, className }: { vip?: boolean; children: ReactNode; className?: string }) =>
    vip ? (
        <span className={`${s.vipFrame} ${className ?? ''}`}>
            {children}
            <i className={s.vipCorner} role="img" aria-label="Thành viên VIP">
                <PlaneMark />
            </i>
        </span>
    ) : (
        <>{children}</>
    );
