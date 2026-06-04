# Deploy Backend lên Render

## Tổng quan

| Thành phần | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://minhthanhvilla.vercel.app |
| Backend | Render | `https://<tên-service>.onrender.com` |
| Database | PlanetScale / Aiven / Railway | MySQL 8 |
| Vector DB | Qdrant Cloud | semantic search |
| Storage | Cloudflare R2 | upload ảnh |

---

## Bước 1 — Chuẩn bị Database MySQL

> Backend cần MySQL 8. Dùng một trong các dịch vụ free sau:

### Option A: PlanetScale (khuyến nghị — free, có SSL sẵn)
1. Tạo account tại https://planetscale.com
2. Tạo database `booking_room`
3. Tạo branch `main` → Connect → lấy connection string
4. Lưu lại: `host`, `username`, `password`
5. **Bật SSL**: PlanetScale yêu cầu SSL mặc định (`MYSQL_SSL=true`)

### Option B: Aiven (free tier 1 tháng)
1. Tạo account tại https://aiven.io
2. Tạo MySQL service → lấy Service URI
3. Tải CA cert về → upload lên Render dưới dạng env `MYSQL_SSL_CA`

### Option C: Railway (free $5 credit)
1. Tạo account tại https://railway.app
2. New Project → MySQL → lấy credentials

---

## Bước 2 — Tạo Web Service trên Render

1. Vào https://render.com → **New** → **Web Service**
2. Kết nối GitHub repo: `athanhneee/BOOKING-WEB`
3. Cấu hình:

| Setting | Giá trị |
|---|---|
| **Name** | `minhthanhvilla-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index.js` |
| **Plan** | Free |
| **Region** | Singapore |

4. **Health Check Path**: `/api/health`

---

## Bước 3 — Cấu hình Environment Variables

Vào tab **Environment** → thêm lần lượt các biến sau:

### 🔴 BẮT BUỘC — Không deploy được nếu thiếu

```env
NODE_ENV=production
PORT=10000
TRUST_PROXY=1

# Database
MYSQLHOST=<host từ PlanetScale/Aiven/Railway>
MYSQLPORT=3306
MYSQLDATABASE=booking_room
MYSQLUSER=<username>
MYSQLPASSWORD=<password>
MYSQL_SSL=true

# JWT Secrets (tạo ngẫu nhiên >= 32 ký tự)
JWT_SECRET_KEY=<random-string-32-chars>
JWT_ACCESS_SECRET=<random-string-32-chars>
JWT_REFRESH_SECRET=<random-string-32-chars>
TOKEN_HASH_SECRET=<random-string-32-chars>
OTP_HASH_SECRET=<random-string-32-chars>
COOKIE_SECRET=<random-string-32-chars>

# CORS
CLIENT_ORIGIN=https://minhthanhvilla.vercel.app
CORS_ORIGINS=https://minhthanhvilla.vercel.app

# Cookie (cross-domain frontend/backend)
REFRESH_TOKEN_COOKIE_SAME_SITE=none
REFRESH_TOKEN_COOKIE_SECURE=true
ALLOW_REFRESH_TOKEN_IN_BODY=false
ALLOW_REFRESH_TOKEN_IN_HEADER=false

# Email (cần để OTP, quên mật khẩu hoạt động)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<your-gmail>@gmail.com
MAIL_PASSWORD=<gmail-app-password>
MAIL_FROM=MinhThanh Villa <your-gmail@gmail.com>

# VNPay
VNPAY_TMN_CODE=<your-code>
VNPAY_HASH_SECRET=<your-secret>
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://<your-render-domain>.onrender.com/api/payments/vnpay/return

# MoMo
MOMO_PARTNER_CODE=<code>
MOMO_ACCESS_KEY=<key>
MOMO_SECRET_KEY=<secret>
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=https://<your-render-domain>.onrender.com/api/payments/momo/return
MOMO_IPN_URL=https://<your-render-domain>.onrender.com/api/payments/webhooks/momo
```

### 🟡 TÙY CHỌN — Để đầy đủ tính năng

```env
# Google OAuth
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>.apps.googleusercontent.com

# Cloudflare R2 (upload ảnh)
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET=booking-images
R2_PUBLIC_BASE_URL=https://<bucket>.r2.dev

R2_PRIVATE_ACCESS_KEY_ID=<key>
R2_PRIVATE_SECRET_ACCESS_KEY=<secret>
R2_PRIVATE_BUCKET=identity-docs-private
R2_PRIVATE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PRIVATE_REGION=auto

# AI Semantic Search + Vision
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=gpt-4.1-mini
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Qdrant (nếu dùng AI Search)
QDRANT_URL=https://<cluster>.qdrant.io
QDRANT_API_KEY=<key>
QDRANT_COLLECTION_LISTINGS=booking_vung_tau_listings
```

---

## Bước 4 — Tạo secret ngẫu nhiên

Dùng lệnh sau để tạo 6 secret mạnh:

```bash
node -e "for(let i=0;i<6;i++) console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Gán lần lượt cho: `JWT_SECRET_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOKEN_HASH_SECRET`, `OTP_HASH_SECRET`, `COOKIE_SECRET`

---

## Bước 5 — Chạy Migration sau khi Deploy

Sau khi service deploy xong lần đầu, vào **Render Shell** hoặc dùng một-off job:

```bash
npm run db:migrate
```

Hoặc bật tạm thời trong env:
```env
ALLOW_PRODUCTION_AUTO_SCHEMA_SYNC=true
```
> ⚠️ Tắt lại sau khi migrate xong!

---

## Bước 6 — Cập nhật Frontend (Vercel)

Vào Vercel dashboard → Settings → Environment Variables, thêm:

```env
VITE_API_BASE_URL=https://<your-render-domain>.onrender.com
```

Sau đó redeploy frontend.

---

## Bước 7 — Cập nhật Google OAuth Redirect

Vào Google Cloud Console → Credentials → OAuth Client ID:
- Thêm **Authorized origins**: `https://<your-render-domain>.onrender.com`
- Thêm **Authorized redirect URIs**: `https://<your-render-domain>.onrender.com/api/auth/google/callback`

---

## Kiểm tra sau deploy

```bash
# Health check
curl https://<your-render-domain>.onrender.com/api/health

# DB check  
curl https://<your-render-domain>.onrender.com/api/health/db

# API test
curl https://<your-render-domain>.onrender.com/api/test
```

---

## Lưu ý về Render Free Plan

| Giới hạn | Free |
|---|---|
| RAM | 512 MB |
| CPU | Shared |
| Spin-down | Sau 15 phút không có request |
| Spin-up | ~30-60 giây lần đầu |
| Bandwidth | 100 GB/tháng |

> 💡 **Tip**: Dùng https://uptimerobot.com để ping `/api/health` mỗi 5 phút để tránh spin-down.
