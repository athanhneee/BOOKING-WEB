# BOOKING-WEB

Ứng dụng đặt phòng lưu trú trực tuyến (tập trung khu vực **Vũng Tàu**), xây dựng với React + TypeScript (frontend) và Express + MySQL (backend).

---

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [Tính năng chính](#tính-năng-chính)
- [Tech Stack](#tech-stack)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Biến môi trường quan trọng (Backend)](#biến-môi-trường-quan-trọng-backend)
- [Scripts hữu ích (Backend)](#scripts-hữu-ích-backend)
- [Scripts hữu ích (Frontend)](#scripts-hữu-ích-frontend)
- [Cấu trúc module backend](#cấu-trúc-module-backend)
- [API & Health check](#api--health-check)
- [Kiểm thử (Testing)](#kiểm-thử-testing)
- [Phân quyền người dùng](#phân-quyền-người-dùng)
- [Bảo mật](#bảo-mật)
- [Triển khai (Deployment)](#triển-khai-deployment)
- [Nhánh Git](#nhánh-git)

---

## Tổng quan kiến trúc

```
BOOKING-WEB/
├── frontend/   # React + TypeScript + Vite
└── backend/    # Express + TypeScript + MySQL (Sequelize) + Socket.IO
```

---

## Tính năng chính

### Phía khách (Guest)
- Tìm kiếm chỗ nghỉ theo địa điểm, ngày, số khách
- Tìm kiếm ngữ nghĩa (AI Semantic Search) bằng OpenAI Embeddings + Qdrant
- Xem chi tiết listing, ảnh, tiện nghi, bản đồ
- Đặt phòng đơn lẻ hoặc nhiều phòng cùng lúc (giỏ chỗ đặt)
- Thanh toán qua **VNPay** và **MoMo** (sandbox)
- Lịch sử chuyến đi, danh sách yêu thích (Wishlist)
- Nhắn tin realtime với host (Socket.IO)
- Đăng nhập / Đăng ký / Google OAuth / Quên mật khẩu (OTP email)

### Phía host (Host Dashboard)
- Quản lý chỗ nghỉ: thêm, sửa, xóa listing
- AI nhận diện ảnh listing (GPT-4.1 Vision)
- Quản lý đặt phòng, lịch lưu trú, khách
- Quản lý doanh thu, yêu cầu rút tiền (payout)
- Báo cáo, đánh giá, hỗ trợ, cài đặt tài khoản
- Nhắn tin với khách

### Phía admin
- Quản lý người dùng, phân quyền
- Duyệt hồ sơ host
- Kiểm duyệt nội dung
- Thống kê tổng quan

---

## Tech Stack

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router v7 |
| State | Custom lightweight store + sessionStorage |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Realtime | Socket.IO Client |
| Maps | Leaflet / React-Leaflet |
| HTTP | Fetch API |

### Backend
| Thành phần | Công nghệ |
|---|---|
| Framework | Express 5 + TypeScript |
| Database | MySQL 8 (Sequelize ORM) |
| Auth | JWT (Access + Refresh token) + Google OAuth |
| Realtime | Socket.IO |
| File upload | Multer + Cloudflare R2 (S3-compatible) |
| Payment | VNPay SDK + MoMo API |
| Email | Nodemailer |
| AI Search | OpenAI Embeddings + Qdrant vector DB |
| AI Vision | OpenAI GPT-4.1 Vision |
| Validation | Zod + express-validator |
| Security | Helmet, express-rate-limit, bcryptjs |

---

## Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- MySQL 8
- Qdrant (nếu dùng AI Search)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa .env với thông tin DB, JWT, payment keys...
npm run db:migrate      # Chạy toàn bộ migration
npm run dev             # Khởi động dev server tại http://localhost:7000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Chỉnh VITE_API_URL=http://localhost:7000
npm run dev             # Khởi động tại http://localhost:5173
```

---

## Biến môi trường quan trọng (Backend)

| Biến | Mô tả |
|---|---|
| `PORT` | Port server (mặc định `7000`) |
| `MYSQLHOST`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD` | Kết nối MySQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Bí mật ký JWT |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Cổng thanh toán VNPay |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` | Cổng thanh toán MoMo |
| `OPENAI_API_KEY` | API key OpenAI (AI Search + Vision) |
| `QDRANT_URL` | URL Qdrant vector DB |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 storage |
| `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD` | SMTP gửi email OTP |
| `CLIENT_ORIGIN` | URL frontend cho CORS |

Xem đầy đủ tại [`backend/.env.example`](./backend/.env.example).

---

## Scripts hữu ích (Backend)

```bash
npm run dev                    # Chạy dev server (nodemon + ts-node)
npm run db:migrate             # Chạy toàn bộ migration
npm run db:check               # Kiểm tra kết nối database
npm run search:reindex         # Tái index dữ liệu lên Qdrant
npm run typecheck              # Kiểm tra TypeScript
npm run test                   # Chạy toàn bộ integration tests
npm run build                  # Build production
```

---

## Scripts hữu ích (Frontend)

```bash
npm run dev                    # Chạy dev server Vite tại http://localhost:5173
npm run build                  # Build production vào thư mục dist/
npm run preview                # Xem thử bản build production
npm run lint                   # Kiểm tra code với ESLint
```

---

## Cấu trúc module backend

```
src/modules/
├── auth/               # Đăng nhập, đăng ký, Google OAuth, OTP
├── users/              # Quản lý tài khoản người dùng
├── listings/           # API listing công khai
├── host-listings/      # API quản lý listing cho host
├── host-onboarding/    # Đăng ký trở thành host
├── host-applications/  # Duyệt hồ sơ host (admin)
├── host-bank-account/  # Tài khoản ngân hàng host
├── bookings/           # Đặt phòng, trạng thái booking
├── payments/           # VNPay, MoMo, callback
├── payouts/            # Rút tiền cho host
├── reviews/            # Đánh giá
├── notifications/      # Thông báo in-app
├── conversations/      # Tin nhắn
├── wishlist/           # Danh sách yêu thích
├── blogs/              # Bài viết blog
├── coupons/            # Mã giảm giá
├── reports/            # Báo cáo thống kê
├── admin/              # Quản trị viên
├── semantic-search/    # AI Semantic Search (OpenAI + Qdrant)
├── ai/                 # AI Vision (GPT-4.1 nhận diện ảnh listing)
├── amenities/          # Tiện nghi
├── banks/              # Danh sách ngân hàng
├── uploads/            # Upload file lên R2
└── verifications/      # Xác minh danh tính host
```

---

## API & Health check

Toàn bộ API đặt dưới tiền tố `/api`. Một số nhóm endpoint chính:

| Tiền tố | Mô tả |
|---|---|
| `/api/auth` | Đăng nhập, đăng ký, Google OAuth, OTP |
| `/api/users` | Tài khoản người dùng |
| `/api/listings` | Listing công khai |
| `/api/host/listings` | Quản lý listing cho host |
| `/api/host/applications` | Hồ sơ đăng ký host |
| `/api/bookings`, `/api/host/bookings` | Đặt phòng (khách & host) |
| `/api/payments`, `/api/coupons` | Thanh toán & mã giảm giá |
| `/api/host` (payouts, bank, onboarding) | Doanh thu & rút tiền host |
| `/api/reviews`, `/api/wishlist` | Đánh giá & yêu thích |
| `/api/conversations`, `/api/notifications` | Tin nhắn & thông báo |
| `/api/search` | AI Semantic Search |
| `/api/ai/listings`, `/api/ai/listings/search` | AI Vision & AI tìm kiếm listing |
| `/api/admin` | Quản trị viên |
| `/api/reports`, `/api/host/reports` | Báo cáo thống kê |
| `/api/amenities`, `/api/banks`, `/api/blogs` | Tiện nghi, ngân hàng, blog |

**Health check:**

| Endpoint | Mục đích |
|---|---|
| `GET /api/health` | Tình trạng tổng quát (database + Qdrant + uptime) |
| `GET /api/health/db` | Kiểm tra riêng kết nối MySQL |

---

## Kiểm thử (Testing)

Backend sử dụng test runner tích hợp của Node (`node --test`) với `ts-node`. Chạy toàn bộ:

```bash
cd backend
npm run test        # Build + chạy tuần tự tất cả integration test
```

| Test suite | Phạm vi |
|---|---|
| `auth-flow.test.ts` | Đăng ký, đăng nhập, refresh token |
| `auth-token-security.test.ts` | Bảo mật access/refresh token |
| `users-rbac-verification.test.ts` | Phân quyền (RBAC) & xác minh |
| `listings-endpoints.test.ts` | API listing công khai |
| `listing-image-vision.test.ts` | AI Vision nhận diện ảnh listing |
| `bookings-endpoints.test.ts` | Luồng đặt phòng & trạng thái booking |
| `payments-coupons-payouts-reports.test.ts` | Thanh toán, mã giảm giá, payout, báo cáo |
| `host-onboarding-verification-flow.test.ts` | Đăng ký & duyệt hồ sơ host |
| `semantic-search.test.ts` | AI Semantic Search |
| `security-middleware.test.ts` | Middleware bảo mật (helmet, rate-limit...) |
| `trust-safety-uc09.test.ts` | Trust & Safety (UC09) |

---

## Phân quyền người dùng

| Role | Quyền |
|---|---|
| `Guest` | Tìm kiếm, xem listing, đặt phòng, thanh toán |
| `host new` | Đang chờ duyệt hồ sơ host |
| `host` | Quản lý listing, bookings, doanh thu, nhắn tin |
| `Moderator` | Kiểm duyệt nội dung |
| `Admin` | Toàn quyền hệ thống |

---

## Bảo mật

- **Xác thực:** JWT Access + Refresh token (refresh token lưu trong cookie `httpOnly`), hỗ trợ Google OAuth.
- **Mật khẩu:** băm bằng `bcryptjs`; OTP được hash trước khi lưu.
- **HTTP hardening:** `helmet`, CORS giới hạn theo `CLIENT_ORIGIN` / `CORS_ORIGINS`, `express-rate-limit`.
- **Validation:** kiểm tra dữ liệu đầu vào bằng `zod` + `express-validator`.
- **Schema production:** server chặn auto-sync schema khi `NODE_ENV=production`; migration chạy qua script deploy.

> Quy trình vận hành bảo mật (xoay vòng secret, CORS/cookie, rate limit, backup/restore) xem chi tiết tại [`backend/docs/SECURITY_RUNBOOK.md`](./backend/docs/SECURITY_RUNBOOK.md).

---

## Triển khai (Deployment)

| Thành phần | Nền tảng | Cấu hình |
|---|---|---|
| Backend | [Render](https://render.com) | [`render.yaml`](./render.yaml) — region Singapore, health check `/api/health` |
| Frontend | [Vercel](https://vercel.com) | [`frontend/vercel.json`](./frontend/vercel.json) — SPA rewrite về `index.html` |

**Backend (Render):**
- Build: `npm install --include=dev && npm run build`
- Start: `node dist/index.js`
- Khai báo các biến môi trường ở mục [Biến môi trường quan trọng](#biến-môi-trường-quan-trọng-backend) trong dashboard Render.
- Chi tiết xem [`backend/RENDER_DEPLOY.md`](./backend/RENDER_DEPLOY.md).

**Frontend (Vercel):**
- Build: `npm run build` → xuất ra `dist/`
- Thiết lập `VITE_API_URL` trỏ tới domain backend đã deploy.

---

## Nhánh Git

| Nhánh | Mục đích |
|---|---|
| `main` | Production-ready |
| `develop` | Phát triển chính |
