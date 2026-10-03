# itjobs - Frontend

Giao diện web của itjobs (React, TypeScript, Vite, Ant Design). Gọi API của backend `DATT`.

## Yêu cầu

- Node.js `^20.19.0` hoặc `>=22.12.0`
- Backend đang chạy ở `http://localhost:8080`

## Chạy frontend (development)

```bash
npm ci
npm run dev
```

Mở http://localhost:3000.

## Chạy bản production

```bash
npm ci
npm run build
npm run preview
```

Thư mục `dist/` sau khi build là toàn bộ trang web để đưa lên hosting.

## Cấu hình

Sửa trong `.env.development` (khi `npm run dev`) hoặc `.env.production` (khi `npm run build`):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `3000` | Cổng của frontend |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Địa chỉ API của backend |
| `VITE_ACL_ENABLE` | `true` | Ẩn nút và trang theo quyền của vai trò |

Trang trắng hoặc lỗi `504 Outdated Optimize Dep` sau khi cài lại thư viện: chạy `npm run dev -- --force`.
