export type PaymentMethodCode = 'VNPAY' | 'ZALOPAY' | 'MOMO' | 'BANK';

// Order of the picker. Logos live in public/payment; swap a path here to use another file (see public/payment/README.md).
export const PAYMENT_METHODS: { code: PaymentMethodCode; label: string; logo: string }[] = [
    { code: 'VNPAY', label: 'VNPay', logo: '/payment/vnpay.svg' },
    { code: 'ZALOPAY', label: 'ZaloPay', logo: '/payment/zalopay.webp' },
    { code: 'MOMO', label: 'MoMo', logo: '/payment/momo.webp' },
    { code: 'BANK', label: 'Ngân hàng', logo: '/payment/bank.webp' },
];

export const paymentLabel = (code?: string | null) => {
    // Keep historical orders readable after removing these methods from the picker.
    if (code === 'VIETQR') return 'VietQR';
    if (code === 'CARD') return 'Thẻ tín dụng';
    return PAYMENT_METHODS.find(method => method.code === code)?.label ?? 'VNPay';
};

// Disable checkout until the server confirms which merchant credentials are configured.
export const DEFAULT_AVAILABLE: Record<PaymentMethodCode, boolean> = {
    MOMO: false,
    VNPAY: false,
    ZALOPAY: false,
    BANK: false,
};
