# BOOKING-WEB

Ứng dụng đặt phòng lưu trú trực tuyến (tập trung khu vực **Vũng Tàu**), xây dựng với React + TypeScript (frontend) và Express + MySQL (backend).

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

## Phân quyền người dùng

| Role | Quyền |
|---|---|
| `Guest` | Tìm kiếm, xem listing, đặt phòng, thanh toán |
| `host new` | Đang chờ duyệt hồ sơ host |
| `host` | Quản lý listing, bookings, doanh thu, nhắn tin |
| `Moderator` | Kiểm duyệt nội dung |
| `Admin` | Toàn quyền hệ thống |

---

## Nhánh Git

| Nhánh | Mục đích |
|---|---|
| `main` | Production-ready |
| `develop` | Phát triển chính |
