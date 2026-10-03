# itjobs (PolyCareers) - Frontend

Giao diện web của nền tảng tuyển dụng IT **itjobs**: ứng viên tìm việc và ứng tuyển, nhà tuyển dụng đăng tin và quản lý hồ sơ, quản trị viên duyệt công ty và theo dõi giao dịch. Frontend nói chuyện với backend Spring Boot (repo `DATT`) qua REST API.

> **Giấy phép.** Mã nguồn bắt nguồn từ dự án cuối khóa *Java Spring RESTful APIs* của **Hỏi Dân IT** và chỉ dành cho học viên của khóa. Theo giấy phép đó, repository chứa mã này **phải để chế độ Private** và không chia sẻ công khai. Liên hệ: admin@hoidanit.vn.

## Công nghệ

React 18, TypeScript, Vite, Ant Design 5, Redux Toolkit, SCSS modules.

## Yêu cầu

- **Node.js** `^20.19.0` hoặc `>=22.12.0`, kèm npm.
- **Backend `DATT`** đang chạy ở `http://localhost:8080` (cùng MySQL). Hướng dẫn chạy backend nằm trong README của repo backend.

## Chạy trên máy (development)

```bash
git clone https://github.com/Roy037/FE-pehome.git
cd FE-pehome
git checkout nam        # nhánh đang phát triển
npm ci                  # cài đúng phiên bản trong package-lock.json
npm run dev             # mở http://localhost:3000
```

Trước khi mở trang, bật backend trước (`./gradlew bootRun` trong thư mục `DATT`). Nếu không có backend, trang vẫn hiện nhưng danh sách việc làm trống và đăng nhập báo lỗi mạng.

## Biến môi trường

Đặt trong `.env.development` (chạy dev) hoặc `.env.production` (build thật):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `3000` | Cổng của Vite. |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Địa chỉ API của backend. |
| `VITE_ACL_ENABLE` | `true` | `true` thì giao diện ẩn nút và trang theo quyền của vai trò. Đặt `false` chỉ để gỡ lỗi. |

Đổi `PORT` thì nhớ đặt `FRONTEND_URL` của backend (trong `DATT/.env`) trùng khớp, vì email, đăng nhập mạng xã hội và thanh toán quay về địa chỉ này.

## Chạy bản production

```bash
npm ci
npm run build           # kiểm tra kiểu rồi build ra thư mục dist/
npm run preview         # xem thử bản build ở máy
```

Đưa thư mục `dist/` lên hosting tĩnh bất kỳ. Nhớ đặt `VITE_BACKEND_URL` là địa chỉ API công khai trước khi build.

## Các lệnh

| Lệnh | Việc làm |
|---|---|
| `npm run dev` | Chạy Vite có hot reload. |
| `npm run build` | `tsc` rồi `vite build`. |
| `npm run preview` | Xem thử bản build. |
| `npm run lint` / `lint:fix` | ESLint (0 lỗi, còn một số cảnh báo `any`). |
| `npm run format` / `format:check` | Prettier. |

## Hướng dẫn sử dụng

### Tài khoản mẫu

Backend tạo sẵn tài khoản quản trị: `admin@gmail.com` / `123456` (vai trò SUPER_ADMIN). Đổi mật khẩu ngay nếu đưa lên môi trường thật. Ứng viên và nhà tuyển dụng tự đăng ký (xem dưới).

### Ứng viên

1. **Đăng ký** ở `/register` (hoặc đăng nhập nhanh bằng Google, Facebook, LinkedIn). Hệ thống gửi email xác thực, bấm nút trong email.
2. **Tìm việc** ở trang chủ hoặc `/job`: lọc theo kỹ năng, địa điểm, mức lương; xem công ty ở `/company`.
3. **Lưu việc** bằng biểu tượng đánh dấu; xem lại ở mục "Hồ sơ & việc làm của tôi".
4. **Ứng tuyển** ở trang chi tiết việc làm: dán link CV (Google Drive...) và thư giới thiệu. Chỉ tài khoản **đã xác thực email** mới ứng tuyển được; chưa xác thực sẽ thấy thanh nhắc "Gửi lại email".
5. **Hồ sơ cá nhân** ở `/ho-so`: tên, tuổi, giới tính, địa chỉ, ảnh đại diện, kỹ năng nhận việc qua email. Bấm vào avatar để đổi mật khẩu hoặc đăng xuất.
6. **Gói Premium**: bấm "Gia hạn / nâng cấp" trong menu tài khoản, chọn gói Basic, Standard hoặc Premium, chọn VNPay, ZaloPay, MoMo hoặc ngân hàng rồi thanh toán. Gói có hiệu lực 30 ngày.
7. **Nhận hoặc hủy bản tin việc làm**: mỗi bản tin có liên kết "Hủy nhận bản tin" (mở `/huy-nhan-tin`).

### Nhà tuyển dụng

1. Đăng ký ở `/nha-tuyen-dung/dang-ky` (tài khoản kèm một công ty), rồi đăng nhập ở `/nha-tuyen-dung/dang-nhap`.
2. Công ty cần được **quản trị viên duyệt** trước khi tin hiển thị. Bị từ chối thì sửa hồ sơ theo góp ý và gửi duyệt lại.
3. Vào `/admin` để đăng tin (**Việc làm**), xem và đổi trạng thái **hồ sơ ứng tuyển**, mời hoặc đổi lịch phỏng vấn, xem đánh giá công ty. Mail gửi tới nhà tuyển dụng chỉ đi tới tài khoản đã xác thực email.

### Quản trị viên

Đăng nhập rồi vào `/admin`. Các mục: Công ty (duyệt, từ chối), Người dùng (khóa, mở khóa), Việc làm, Hồ sơ, Đánh giá, Báo cáo tin, Nhân tài, Việc đã lưu, Người đăng ký bản tin, **Giao dịch**, Phân quyền, Vai trò. Mục nào hiện ra phụ thuộc quyền của vai trò (`VITE_ACL_ENABLE`).

### Đăng nhập mạng xã hội

Nút Google, Facebook, LinkedIn trên form đăng nhập chỉ sáng khi backend có khóa tương ứng trong `DATT/.env` (`GOOGLE_*`, `FACEBOOK_*`, `LINKEDIN_*`). Cách đăng ký ứng dụng và redirect URI (`<BACKEND_URL>/api/v1/auth/oauth/<google|facebook|linkedin>/callback`) có ở README của backend. Luồng chạy ở backend nên khóa bí mật không bao giờ ra trình duyệt.

### Thanh toán thử (sandbox)

Thanh toán chạy qua cổng thử nghiệm của VNPay, ZaloPay, MoMo. Cổng nào backend chưa có khóa thì hiện xám. Muốn chạy mà không cần tài khoản cổng nào, bật cổng giả `PAYMENT_MOCK=true` ở backend (chỉ để phát triển). Thẻ thử VNPay: ngân hàng **NCB**, số thẻ `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456`. Các thẻ thử khác và cách lấy khóa sandbox nằm ở README của backend.

## Cấu trúc thư mục

```
src/
  components/   admin/ (bảng quản trị), client/ (giao diện khách), share/ (dùng chung)
  pages/        admin/, auth/, company/, home/, job/, profile/
  redux/        slice cho tài khoản, việc làm, công ty, gói, việc đã lưu...
  config/       api.ts (gọi backend), axios-customize.ts, permissions.ts, utils.ts
  styles/       SCSS modules và biến chung
public/         ảnh WebP, logo công ty, biểu tượng thanh toán
```

## Lỗi thường gặp

- **Trang trắng hoặc `504 Outdated Optimize Dep`** sau khi đổi thư viện: xóa cache của Vite bằng `npm run dev -- --force`.
- **Danh sách trống, đăng nhập lỗi mạng**: backend chưa chạy hoặc `VITE_BACKEND_URL` sai.
- **Ứng tuyển báo 403**: tài khoản chưa xác thực email, bấm "Gửi lại email" ở thanh nhắc.
- **Đăng nhập Google, Facebook, LinkedIn quay về với `oauth_error`**: kiểm tra redirect URI đã khai báo ở nhà cung cấp phải khớp từng ký tự với địa chỉ backend.
- **Cổng 3000 đang bị chiếm**: đổi `PORT` trong file `.env.development` và `FRONTEND_URL` của backend cho khớp.
