# Payment method logos

Shown in the payment popup (`src/components/client/modal/upgrade.modal.tsx`); the list and paths live in `src/config/payment-methods.ts`.

- `vietqr.webp`, `zalopay.webp`, `bank.webp`, `cards.webp`: cropped from the design mock-up (placeholders).
- `momo.webp`: the MoMo mark already used in `public/logos`.
- `vnpay.svg`: a plain text wordmark, **a placeholder** for the official logo.

To use the official logos, drop the SVG files here and update the paths in `src/config/payment-methods.ts`. Logos are shown at most 64px wide and 24px tall, so keep them horizontal.
