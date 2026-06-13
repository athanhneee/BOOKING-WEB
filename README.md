<div align="center">
  <h1>🏨 BOOKING-WEB</h1>
  <p>Ứng dụng đặt phòng lưu trú trực tuyến (tập trung khu vực <strong>Vũng Tàu</strong>)</p>
  
  <h3>
    🌐 <a href="https://minhthanhvilla.vercel.app">Live Demo (minhthanhvilla.vercel.app)</a>
  </h3>

  <p>
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>
</div>

<br />

## 📖 Mục lục

- [Tổng quan kiến trúc](#-tổng-quan-kiến-trúc)
- [Tính năng chính](#-tính-năng-chính)
- [Tech Stack](#-tech-stack)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Cấu trúc module backend](#-cấu-trúc-module-backend)
- [API & Health Check](#-api--health-check)
- [Kiểm thử (Testing)](#-kiểm-thử-testing)
- [Bảo mật & Phân quyền](#-bảo-mật--phân-quyền)
- [Triển khai (Deployment)](#-triển-khai-deployment)
- [Nhánh Git](#-nhánh-git)

---

## 🏛 Tổng quan kiến trúc

Dự án được xây dựng theo mô hình đơn giản với Frontend và Backend tách biệt:

```text
BOOKING-WEB/
├── frontend/   # SPA (React + TypeScript + Vite)
└── backend/    # REST API (Express + TypeScript + MySQL/Sequelize + Socket.IO)
```

---

## ✨ Tính năng chính

### 🧑‍💻 Phía khách (Guest)
- **Tìm kiếm thông minh**: Tìm theo địa điểm, ngày, số lượng khách. Hỗ trợ **AI Semantic Search** (OpenAI Embeddings + Qdrant) cho phép tìm bằng ngôn ngữ tự nhiên.
- **Trải nghiệm mượt mà**: Xem chi tiết listing, hình ảnh, tiện nghi, và bản đồ tương tác.
- **Đặt phòng & Thanh toán**: Đặt phòng đơn lẻ hoặc đưa vào giỏ hàng đặt nhiều phòng cùng lúc. Hỗ trợ thanh toán qua **VNPay** và **MoMo** (sandbox).
- **Tương tác**: Nhắn tin realtime với Host qua Socket.IO. Quản lý danh sách yêu thích (Wishlist) và lịch sử chuyến đi.
- **Xác thực**: Đăng nhập/Đăng ký truyền thống, Google OAuth, Quên mật khẩu qua OTP Email.

### 🏠 Phía chủ nhà (Host Dashboard)
- **Quản lý Listing**: Thêm, sửa, xóa phòng/chỗ nghỉ. Tích hợp **AI Vision (GPT-4.1)** tự động nhận diện và phân tích ảnh.
- **Vận hành**: Quản lý lịch lưu trú, xác nhận yêu cầu đặt phòng, quản lý khách.
- **Tài chính**: Theo dõi doanh thu, báo cáo thống kê, gửi yêu cầu rút tiền (payout).
- **Giao tiếp**: Nhắn tin hỗ trợ khách hàng theo thời gian thực.

### 🛡 Phía quản trị (Admin)
- Quản lý người dùng, phân quyền hệ thống.
- Xét duyệt hồ sơ đăng ký trở thành Host.
- Kiểm duyệt nội dung (Listing).
- Thống kê tổng quan nền tảng.

---

## 🛠 Tech Stack

### Frontend
- **Core**: React 19, TypeScript, Vite
- **Routing**: React Router v7
- **State Management**: Custom lightweight store + sessionStorage
- **UI/UX**: Tailwind CSS v4, Recharts (Biểu đồ)
- **Khác**: Socket.IO Client (Realtime), Leaflet / React-Leaflet (Bản đồ)

### Backend
- **Core**: Express 5, Node.js, TypeScript
- **Database**: MySQL 8 (Sequelize ORM)
- **AI Integration**: OpenAI (Embeddings + Vision), Qdrant Vector DB
- **Realtime**: Socket.IO
- **Storage**: Multer + Cloudflare R2 (S3-compatible)
- **Payment & Email**: VNPay SDK, MoMo API, Nodemailer
- **Security & Validation**: JWT, Google OAuth, Helmet, express-rate-limit, bcryptjs, Zod, express-validator

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- Node.js >= 18
- MySQL 8
- Qdrant (Bắt buộc nếu sử dụng tính năng AI Search)

### 1. Khởi chạy Backend

```bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa file .env với thông tin DB, JWT, payment keys, OpenAI key...

npm run db:migrate      # Chạy toàn bộ migration
npm run dev             # Khởi động dev server tại http://localhost:7000
```

**Các script hữu ích:**
- `npm run db:check`: Kiểm tra kết nối database
- `npm run search:reindex`: Tái index dữ liệu lên Qdrant
- `npm run typecheck`: Kiểm tra TypeScript
- `npm run test`: Chạy toàn bộ integration tests
- `npm run build`: Build production

### 2. Khởi chạy Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Đảm bảo VITE_API_URL=http://localhost:7000

npm run dev             # Khởi động dev server tại http://localhost:5173
```

**Các script hữu ích:**
- `npm run build`: Build production vào thư mục dist/
- `npm run preview`: Xem thử bản build production
- `npm run lint`: Kiểm tra code với ESLint

---

## 📦 Cấu trúc module backend

```text
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

## 🔌 API & Health Check

Hệ thống API RESTful với tiền tố `/api`. Một số nhóm chính:

- **Auth**: `/api/auth`
- **Users & Admin**: `/api/users`, `/api/admin`
- **Listings**: `/api/listings` (Public), `/api/host/listings` (Host)
- **Bookings**: `/api/bookings`, `/api/host/bookings`
- **Payments & Coupons**: `/api/payments`, `/api/coupons`
- **AI Features**: `/api/search` (Semantic), `/api/ai/listings` (Vision)
- **Host Ops**: `/api/host` (Payouts, Banks, Applications)
- **Comms & Content**: `/api/conversations`, `/api/notifications`, `/api/reviews`, `/api/blogs`

**Health Check:**
- `GET /api/health`: Tình trạng tổng quát (DB + Qdrant + Uptime)
- `GET /api/health/db`: Kiểm tra riêng kết nối MySQL

---

## 🧪 Kiểm thử (Testing)

Backend sử dụng Node.js native test runner (`node --test`) kết hợp `ts-node`. Bao gồm 11 Integration Test Suites phủ các luồng quan trọng: Auth, RBAC, Bookings, Payments, AI, Trust & Safety.

```bash
cd backend
npm run test  # Chạy toàn bộ test suites
```

---

## 🔒 Bảo mật & Phân quyền

### Phân quyền (RBAC)
- **Guest**: Tìm kiếm, đặt phòng, thanh toán.
- **host new**: Đang chờ duyệt hồ sơ.
- **host**: Quản lý listing, booking, doanh thu.
- **Moderator**: Kiểm duyệt nội dung.
- **Admin**: Toàn quyền hệ thống.

### Cơ chế bảo mật
- **Xác thực**: JWT (Access Token gửi qua header, Refresh Token lưu trong `httpOnly` cookie).
- **Bảo vệ dữ liệu**: Mật khẩu băm `bcryptjs`.
- **Chống tấn công**: Tích hợp `helmet`, `express-rate-limit`, CORS policy theo `CLIENT_ORIGIN`.
- **Validation**: Strict validation với `zod` và `express-validator`.
- *Tham khảo [`backend/docs/SECURITY_RUNBOOK.md`](./backend/docs/SECURITY_RUNBOOK.md) để biết thêm chi tiết vận hành.*

---

## ☁️ Triển khai (Deployment)

Dự án được cấu hình sẵn để deploy lên các nền tảng đám mây:

| Thành phần | Nền tảng | Cấu hình tham khảo |
|---|---|---|
| **Backend** | [Render](https://render.com) | Sử dụng [`render.yaml`](./render.yaml). Cần khai báo các biến môi trường trong dashboard. Xem [`backend/RENDER_DEPLOY.md`](./backend/RENDER_DEPLOY.md) |
| **Frontend** | [Vercel](https://vercel.com) | Tự động qua Github. Cấu hình SPA rewrite tại [`frontend/vercel.json`](./frontend/vercel.json) |

---

## 🌿 Nhánh Git

- `main`: Code ổn định, sẵn sàng cho Production.
- `develop`: Nhánh phát triển chính.
