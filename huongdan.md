# Hướng Dẫn Luồng Hoạt Động Dự Án Minh Thành Villa

## 1. Tổng quan hệ thống

Minh Thành Villa là hệ thống đặt villa/chỗ nghỉ tại Vũng Tàu.

| Thành phần | Công nghệ | Ghi chú demo |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript, React Router, React Query | Source chính ở `frontend/src`, route ở `frontend/src/router/AppRouter.tsx` và `frontend/src/config/routes.ts`. |
| Backend | Node.js, Express, TypeScript, Sequelize | Source chính ở `backend/src`, mount API ở `backend/src/app.ts`. |
| Database | MySQL | Sequelize model dùng tên cột snake_case trong DB. |
| Storage ảnh | Cloudflare R2 / S3-compatible | Ảnh listing dùng presigned upload public; giấy tờ host dùng R2 private. |
| AI | OpenAI embeddings, OpenAI Vision, Qdrant vector search | Semantic search có fallback keyword khi OpenAI/Qdrant lỗi. |
| Payment | VNPay, MoMo | Booking tạo trước ở trạng thái `pending_payment`, payment tạo sau khi bấm thanh toán. |
| Realtime | Socket.IO | Dùng cho chat và notification realtime. |

Nhóm người dùng:

| Nhóm | Ý nghĩa | Nơi kiểm tra quyền |
| --- | --- | --- |
| Guest | Chưa đăng nhập | Chỉ xem public listing/search/blog. |
| User/Customer | Đã đăng nhập, role `guest` | Đặt phòng, thanh toán, wishlist, chat, profile. |
| Host | Role `host` | Quản lý listing, lịch, booking host, payout, tin nhắn host. |
| Moderator | Role `moderator` | Backend cho phép duyệt listing; frontend hiện chỉ mở admin route cho role UI `Admin`. |
| Admin | Role `admin` | Quản trị user, host application, duyệt listing, payout, report. |

Phân quyền thật trong DB không nằm ở cột `users.role`. Backend dùng bảng `roles` và `user_role`. Nếu một DB cũ còn cột `users.role`, cần kiểm tra lại trong DB thực tế vì model runtime chính không dùng cột này làm nguồn quyền chính.

## 2. Cách chạy dự án

### 2.1. Backend

Thư mục: `backend`.

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm test
```

Script DB/AI hữu ích:

```bash
npm run db:check
npm run db:migrate:safe
npm run search:reindex
npm run qdrant:check
```

Biến môi trường quan trọng, không ghi secret thật khi demo:

| Nhóm | Biến |
| --- | --- |
| Server/CORS | `PORT`, `NODE_ENV`, `CLIENT_URL`, `CLIENT_ORIGIN`, `CORS_ORIGIN`, `CORS_ORIGINS`, `TRUST_PROXY` |
| MySQL | `MYSQLHOST`, `MYSQL_HOST`, `MYSQLPORT`, `MYSQL_DATABASE`, `MYSQLUSER`, `MYSQL_PASSWORD`, `MYSQL_SSL`, `ALLOW_DATABASE_ROOT_USER` |
| JWT/cookie | `JWT_SECRET_KEY`, `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOKEN_HASH_SECRET`, `OTP_HASH_SECRET`, `COOKIE_SECRET`, `REFRESH_TOKEN_COOKIE_NAME`, `REFRESH_TOKEN_COOKIE_SAME_SITE`, `REFRESH_TOKEN_COOKIE_SECURE` |
| Auth/Otp/Mail | `GOOGLE_CLIENT_ID`, `AUTH_DEBUG_OTP`, `OTP_TTL_MINUTES`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` |
| Payment | `PAYMENT_HOLD_MINUTES`, `PAYMENT_EXPIRATION_SWEEP_INTERVAL_SECONDS`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAYMENT_URL`, `VNPAY_RETURN_URL`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL` |
| R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_PRIVATE_ACCESS_KEY_ID`, `R2_PRIVATE_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`, `R2_PRIVATE_ENDPOINT` |
| AI | `OPENAI_API_KEY`, `OPENAI_VISION_MODEL` |

### 2.2. Frontend

Thư mục: `frontend`.

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Biến môi trường quan trọng:

| Biến | Mục đích |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL gọi backend, ví dụ `http://localhost:7000`. |
| `VITE_GOOGLE_CLIENT_ID` | Client ID cho Google OAuth phía frontend. |

### 2.3. Database

Database dùng MySQL. Khi demo có thể mở bằng MySQL Workbench, DBeaver, phpMyAdmin hoặc CLI:

```bash
mysql -h <HOST> -P <PORT> -u <USER> -p <DATABASE>
```

Backend có script migration an toàn:

```bash
cd backend
npm run db:migrate:safe
```

Khi server chạy, `backend/src/server.ts` gọi `ensureRuntimeSchema()` và `sequelize.sync()` ngoài production nếu cấu hình cho phép. Production không nên dựa vào auto-sync; dùng migration/script rõ ràng.

### 2.4. Kết quả kiểm tra source ngày 10/06/2026

| Lệnh | Kết quả |
| --- | --- |
| `cd backend && npm run build` | Pass. |
| `cd backend && npm run typecheck` | Pass. |
| `cd backend && npm test` | Fail 1/121 test. 120 pass, 1 fail ở `tests/listings-endpoints.test.ts`, case kỳ vọng moderator nhận 403 nhưng thực tế trả 500 do Sequelize không kết nối được MySQL user `booking_app` không password: `Access denied for user 'booking_app'@'localhost' (using password: NO)`. Đây là lỗi môi trường DB local trong lúc test, không phải lỗi compile. |
| `cd frontend && npm run lint` | Pass. |
| `cd frontend && npm run build` | Pass. Vite có cảnh báo `INEFFECTIVE_DYNAMIC_IMPORT` vì `authService.ts` vừa dynamic import vừa static import ở nhiều file. |

## 3. Sơ đồ route frontend

| Màn hình | URL | Component chính | Quyền truy cập | Mục đích |
| --- | --- | --- | --- | --- |
| Trang chủ | `/` | `frontend/src/views/pages/Home/HomePage` | Public | Landing/home và điều hướng tìm villa. |
| Danh sách villa | `/search`, `/noi-luu-tru` | `frontend/src/views/pages/Search/SearchPage.tsx` | Public | Tìm kiếm thường, lọc theo vị trí/ngày/khách/giá/tiện ích. |
| AI Search | `/ai-search` | `frontend/src/views/pages/AiSearch/AiSearchPage.tsx` | Public | Tìm villa bằng câu tự nhiên. |
| Blog | `/blog`, `/blog/:slug` | `BlogPage`, `BlogDetailPage` | Public | Nội dung blog. |
| Liên hệ | `/lien-he` | `ContactPage` | Public | Thông tin liên hệ. |
| Đăng nhập | `/dang-nhap` | `Auth/LoginPage` | Public | Login email/password hoặc Google. |
| Đăng ký | `/dang-ky` | `Auth/RegisterPage` | Public | Tạo tài khoản. |
| Quên mật khẩu | `/quen-mat-khau` | `Auth/ForgotPasswordPage` | Public | OTP/reset password. |
| Trở thành host | `/tro-thanh-host` | `TroThanhHost/index.jsx` | Public | Landing giới thiệu host. |
| Đăng ký host | `/tro-thanh-host/dang-ky` | `TroThanhHost/DangKyHost.jsx` | Authenticated | Nộp hồ sơ host và giấy tờ. |
| Trạng thái host | `/tro-thanh-host/trang-thai` | `TroThanhHost/TrangThai.jsx` | Authenticated | Xem trạng thái hồ sơ host. |
| Hồ sơ cá nhân | `/account/profile` | `Trips/index.tsx` | Authenticated | Hồ sơ và lịch sử chuyến đi. |
| Chuyến đi | `/account/trips` | `Trips/index.tsx` | Authenticated | Danh sách booking của khách. |
| Wishlist | `/yeu-thich` | `Wishlist/WishlistPage` | Authenticated | Villa đã lưu. |
| Giỏ chờ đặt | `/gio-cho-dat` | `MultiBooking/MultiBookingPage.tsx` | Authenticated | Đặt nhiều villa từ queue. |
| Tin nhắn khách | `/messages` | `Messages/MessagesPage.tsx` | Authenticated | Chat với host. |
| Chi tiết villa | `/villa/:villaId` | `ListingDetail/ListingDetailPage.tsx` | Public | Gallery, giá, lịch, đặt phòng, wishlist, nhắn host. |
| Nhắn host từ villa | `/villa/:villaId/nhan-tin-host` | `HostMessage/HostMessagePage.tsx` | Public route, cần login để chat | Tạo/mở conversation với host của listing. |
| Host - Chỗ nghỉ | `/chu-nha/cho-nghi` | `Host/ChoNghi/index.tsx` | Host | Danh sách listing của host. |
| Host - Thêm chỗ nghỉ | `/chu-nha/cho-nghi/them-moi` | `Host/ThemChoNghi/index.tsx` | Host | Tạo/sửa listing, ảnh, AI Vision. |
| Host - Đặt phòng | `/chu-nha/dat-phong` | `Host/DatPhong/index.tsx` | Host | Xác nhận, check-in, check-out, hủy booking. |
| Host - Lịch lưu trú | `/chu-nha/lich-luu-tru` | `Host/LichLuuTru/index.tsx` | Host | Mở/đóng ngày, chỉnh availability. |
| Host - Khách lưu trú | `/chu-nha/khach-luu-tru` | `Host/KhachLuuTru/index.tsx` | Host | Theo dõi khách. |
| Host - Thanh toán | `/chu-nha/thanh-toan` | `Host/ThanhToan/index.tsx` | Host | Tài khoản payout và danh sách payout. |
| Host - Đánh giá | `/chu-nha/danh-gia` | `Host/DanhGia/index.tsx` | Host | Quản lý review. |
| Host - Báo cáo | `/chu-nha/bao-cao` | `Host/BaoCao/index.tsx` | Host | Báo cáo doanh thu/booking. |
| Host - Hỗ trợ | `/chu-nha/ho-tro` | `Host/HoTro/index.tsx` | Host | Hỗ trợ. |
| Host - Cài đặt | `/chu-nha/cai-dat` | `Host/CaiDat/index.tsx` | Host | Cài đặt host. |
| Host - Tin nhắn mới | `/host/tin-nhan` | `Host/TinNhan/index.tsx` | Host | Chat ở layout host. |
| Host - Tin nhắn legacy | `/chu-nha/tin-nhan` | Redirect | Host | Redirect sang `/host/tin-nhan`. |
| Admin tổng quan | `/admin` | `Admin/index.jsx` | Frontend role `Admin` | Dashboard admin. |
| Admin người dùng | `/admin/nguoi-dung` | `Admin/QuanLyNguoiDung/index.jsx` | Admin | Quản lý user/role/status. |
| Admin duyệt listing | `/admin/kiem-duyet` | `Admin/KiemDuyetBaiDang/index.jsx` | Admin UI; backend cho admin/moderator | Approve/reject listing pending. |
| Admin hồ sơ host | `/admin/ho-so-host` | `Admin/HoSoHost/index.jsx` | Admin | Duyệt hồ sơ host. |
| Admin phân quyền | `/admin/phan-quyen` | `Admin/PhanQuyenHeThong/index.jsx` | Admin | Màn hình phân quyền. |
| Thanh toán booking | `/thanh-toan/:bookingId` | `GuestPayment/index.tsx` | Route public, API cần user sở hữu booking | Chọn VNPay/MoMo và tạo payment URL. |
| Kết quả thanh toán | `/thanh-toan/ket-qua` | `GuestPayment/PaymentResultPage.tsx` | Public route | Hiển thị kết quả từ return URL/payment detail. |

## 4. Sơ đồ API backend

Backend mount API tại `backend/src/app.ts`.

| Nhóm API | Method | Endpoint | Route file | Controller/Service | Quyền | Mục đích |
| --- | --- | --- | --- | --- | --- | --- |
| Auth | `POST` | `/api/auth/register` | `modules/auth/auth.routes.ts` | `auth.controller.ts`, `auth.service.ts` | Public | Đăng ký user, tạo session, gửi OTP email. Payload cần `firstName`, `lastName`, `email`, `password`. |
| Auth | `POST` | `/api/auth/login` | `auth.routes.ts` | `login` | Public | Login email/username/password. Payload dùng field `identifier` (có thể map từ `emailOrUsername`). |
| Auth | `POST` | `/api/auth/google` | `auth.routes.ts` | `loginWithGoogle` | Public | Google login bằng `idToken`. |
| Auth | `POST` | `/api/auth/refresh` | `auth.routes.ts` | `refresh` | Public + refresh cookie/token | Cấp access token mới. |
| Auth | `POST` | `/api/auth/logout` | `auth.routes.ts` | `logout`, revoke refresh session | Auth | Đăng xuất. |
| Auth | `GET` | `/api/auth/me` | `auth.routes.ts` | `getCurrentUser` | Auth | Lấy user hiện tại. |
| Auth | `POST` | `/api/auth/send-otp` | `auth.routes.ts` | `sendOtp` | Public | Gửi OTP xác thực. Payload: `identifier`. |
| Auth | `POST` | `/api/auth/verify-email` | `auth.routes.ts` | `verifyEmail` | Public | Xác thực email bằng OTP. Payload: `identifier`, `otp`. |
| Auth | `POST` | `/api/auth/verify-phone` | `auth.routes.ts` | `verifyPhone` | Public | Xác thực SĐT bằng OTP. Payload: `identifier`, `otp`. |
| Listings public | `GET` | `/api/listings` | `modules/listings/listings.routes.ts` | `listPublicListings` | Public | Search/list listing active. |
| Listings public | `GET` | `/api/listings/:listingId` | `listings.routes.ts` | `getPublicListingDetail` | Public | Chi tiết listing active. |
| Listings public | `GET` | `/api/listings/:listingId/availability` | `listings.routes.ts` | availability service | Public | Lịch availability theo tháng. |
| Listings public | `GET` | `/api/listings/:listingId/reviews` | `listings.routes.ts` / reviews service | reviews | Public | Review của listing. |
| Listings public | `GET` | `/api/listings/:listingId/rules` | `listings.routes.ts` | rules service | Public | Quy định listing. |
| Semantic search | `POST` | `/api/search/semantic` | `modules/semantic-search/semantic-search.routes.ts` | `semantic-search.service.ts` | Public/Auth optional | Tìm bằng câu tự nhiên. |
| AI listing search legacy | `POST` | `/api/ai/listings/search` | `modules/semantic-search/ai-listing-search.routes.ts` | semantic search service | Public | Endpoint AI search tương thích cũ. |
| Bookings guest | `POST` | `/api/bookings` | `modules/bookings/bookings.routes.ts` | `bookings.controller.ts`, `bookings.service.ts` | `guest`, `host`, `admin` đã auth | Tạo booking pending payment. |
| Bookings guest | `POST` | `/api/bookings/bulk` | `bookings.routes.ts` | bulk booking service | Auth | Tạo nhiều booking. |
| Bookings guest | `GET` | `/api/bookings/mine` | `bookings.routes.ts` | booking list service | Auth | Booking của user hiện tại. |
| Bookings guest | `GET` | `/api/bookings/:bookingId` | `bookings.routes.ts` | booking detail service | Auth + owner/host/admin | Xem booking. |
| Bookings guest | `POST` | `/api/bookings/:bookingId/cancel` | `bookings.routes.ts` | cancel service | Auth + owner | Khách hủy. |
| Host bookings | `GET` | `/api/host/bookings` | `modules/bookings/host-bookings.routes.ts` | host booking service | Host only | Danh sách booking thuộc listing của host. |
| Host bookings | `PATCH` | `/api/host/bookings/:bookingId/confirm` | `host-bookings.routes.ts` | confirm service | Host only | Xác nhận sau khi đã paid. |
| Host bookings | `POST/PATCH` | `/api/host/bookings/:bookingId/check-in` | `host-bookings.routes.ts` | check-in service | Host only | Nhận phòng. |
| Host bookings | `POST/PATCH` | `/api/host/bookings/:bookingId/check-out` | `host-bookings.routes.ts` | check-out service | Host only | Trả phòng. |
| Host bookings | `PATCH` | `/api/host/bookings/:bookingId/cancel` | `host-bookings.routes.ts` | host cancel/reject service | Host only | Host hủy/reject. |
| Payments | `GET` | `/api/payments/methods` | `modules/payments/payments.routes.ts` | `getPaymentMethods` | Public | Danh sách phương thức khả dụng. |
| Payments | `POST` | `/api/payments` | `payments.routes.ts` | `createPaymentRequest`, `payments.service.ts` | Auth | Tạo payment pending và payment URL. |
| Payments | `GET` | `/api/payments/my` | `payments.routes.ts` | `getMyPaymentHistory` | Auth | Lịch sử payment. |
| Payments | `GET` | `/api/payments/:paymentId` | `payments.routes.ts` | `getPaymentById` | Auth | Chi tiết payment. |
| VNPay | `GET` | `/api/payments/vnpay/return` | `payments.routes.ts` | `handleVnpayReturn` | Public callback | Return URL sandbox/production. |
| VNPay | `POST/GET` | `/api/payments/webhooks/vnpay` | `payments.routes.ts` | `handleVnpayWebhook` | Public callback + signature | Webhook/IPN VNPay. |
| MoMo | `GET` | `/api/payments/momo/return` | `payments.routes.ts` | `handleMomoReturn` | Public callback | Return URL MoMo. |
| MoMo | `POST` | `/api/payments/webhooks/momo` | `payments.routes.ts` | `handleMomoWebhook` | Public callback + signature | Webhook/IPN MoMo. |
| Host listings | `POST` | `/api/host/listings` | `modules/host-listings/host-listings.routes.ts` | `host-listings.service.ts` | Host only | Tạo listing draft/pending. |
| Host listings | `GET` | `/api/host/listings/mine` | `host-listings.routes.ts` | list service | Host only | Listing của host. |
| Host listings | `GET/PATCH/DELETE` | `/api/host/listings/:listingId` | `host-listings.routes.ts` | detail/update/delete service | Host owner | Xem/sửa/xóa mềm listing. |
| Host calendar | `GET` | `/api/host/listings/:listingId/calendar` | `host-listings.routes.ts` | `getListingCalendar` | Host owner | Xem lịch. |
| Host calendar | `PATCH` | `/api/host/listings/:listingId/calendar/bulk` | `host-listings.routes.ts` | `bulkUpdateListingCalendar` | Host owner | Mở/đóng nhiều ngày. |
| Host images | `POST` | `/api/host/listings/:listingId/images` | `host-listings.routes.ts` | `addListingImages` | Host owner | Ghi metadata ảnh sau khi upload R2. |
| Host images | `PATCH` | `/api/host/listings/:listingId/images/:imageId/cover` | `host-listings.routes.ts` | `setListingImageCover` | Host owner | Đặt ảnh cover. |
| Host images | `DELETE` | `/api/host/listings/:listingId/images/:imageId` | `host-listings.routes.ts` | `deleteListingImage` | Host owner | Xóa ảnh. |
| Uploads | `POST` | `/api/uploads/presign` | `modules/uploads/uploads.routes.ts` | R2 upload service | Auth | Lấy presigned URL upload ảnh public. |
| AI Vision | `POST` | `/api/host/listings/:listingId/images/:imageId/analyze` | `modules/ai/listing-image-vision.routes.ts` | `listing-image-vision.service.ts` | Host owner | Phân tích 1 ảnh (qua hostListingImageVisionRoutes). |
| AI Vision | `GET` | `/api/host/listings/:listingId/images/analysis` | `listing-image-vision.routes.ts` | `getHostListingImageAnalysis` | Host owner | Lấy kết quả phân tích ảnh của listing. |
| AI Vision | `POST` | `/api/ai/listings/:listingId/analyze-images` | `listing-image-vision.routes.ts` | `analyzeAllListingImages` | Host/admin | Phân tích nhiều ảnh, có thể force (qua router `/api/ai/listings`). |
| AI Vision | `POST` | `/api/admin/images/:imageId/reanalyze` | `listing-image-vision.routes.ts` | `reanalyzeAdminImage` | Admin | Admin phân tích lại. |
| AI Vision | `PATCH` | `/api/host/images/:imageId/tags` | `listing-image-vision.routes.ts` | `updateHostImageTags` | Host | Host chỉnh tag ảnh (qua hostImageVisionRoutes). |
| AI Vision | `DELETE` | `/api/host/images/:imageId` | `listing-image-vision.routes.ts` | `deleteHostImageById` | Host | Host xóa ảnh qua imageId (qua hostImageVisionRoutes). |
| Wishlist | `GET` | `/api/wishlist` | `modules/wishlist/wishlist.routes.ts` | `wishlist.service.ts` | Auth | Lấy wishlist. |
| Wishlist | `POST` | `/api/wishlist/:listingId` | `wishlist.routes.ts` | `addListingToWishlist` | Auth | Lưu villa active. |
| Wishlist | `DELETE` | `/api/wishlist/:listingId` | `wishlist.routes.ts` | `removeListingFromWishlist` | Auth | Bỏ lưu. |
| Chat | `GET` | `/api/conversations` | `modules/conversations/conversations.routes.ts` | `conversations.service.ts` | Auth active | Danh sách conversation. |
| Chat | `POST` | `/api/conversations` | `conversations.routes.ts` | `createConversation` | Auth active | Tạo/mở conversation theo listing/booking/direct. |
| Chat | `GET` | `/api/conversations/:conversationId/messages` | `conversations.routes.ts` | `listMessages` | Participant | Lấy tin nhắn. |
| Chat | `POST` | `/api/conversations/:conversationId/messages` | `conversations.routes.ts` | `sendMessage` | Participant | Gửi tin nhắn. |
| Chat | `PATCH` | `/api/conversations/:conversationId/read` | `conversations.routes.ts` | `markRead` | Participant | Đánh dấu đã đọc. |
| Notifications | `GET` | `/api/notifications` | `modules/notifications/notifications.routes.ts` | `notification.service.ts` | Auth | Lấy notification in-app. |
| Notifications | `PATCH` | `/api/notifications/read-all` | `notifications.routes.ts` | `markAllNotificationsRead` | Auth | Đánh dấu tất cả đã đọc. |
| Notifications | `PATCH` | `/api/notifications/:id/read` | `notifications.routes.ts` | `markNotificationRead` | Auth | Đánh dấu 1 notification. |
| Admin listing | `GET` | `/api/admin/listings/pending` | `modules/admin/admin-listings.routes.ts` | admin listing service | Backend `admin` hoặc `moderator` | Listing chờ duyệt. |
| Admin listing | `PATCH` | `/api/admin/listings/:listingId/approve` | `admin-listings.routes.ts` | approve service | Backend `admin` hoặc `moderator` | Duyệt listing -> `active`. |
| Admin listing | `PATCH` | `/api/admin/listings/:listingId/reject` | `admin-listings.routes.ts` | reject service | Backend `admin` hoặc `moderator` | Từ chối listing. |
| Host application | `GET` | `/api/host/applications/me` | `modules/host-applications/host-application.routes.ts` | host application service | Auth active | Xem hồ sơ host của mình. |
| Host application | `POST` | `/api/host/applications` | `host-application.routes.ts` | submit service | Auth active | Nộp hồ sơ host + giấy tờ. |
| Admin host app | `GET` | `/api/admin/host-applications` | `modules/admin/admin-host-application.routes.ts` | host application service | Admin | Danh sách hồ sơ host. |
| Admin host app | `PATCH` | `/api/admin/host-applications/:applicationId/approve` | `admin-host-application.routes.ts` | approve service | Admin | Duyệt host, cấp role `host`. |
| Admin host app | `PATCH` | `/api/admin/host-applications/:applicationId/reject` | `admin-host-application.routes.ts` | reject service | Admin | Từ chối hồ sơ. |
| Host payout | `GET` | `/api/host/payout-accounts` | `modules/payouts/host-payouts.routes.ts` | `listPayoutAccounts` | Host only | Danh sách tài khoản nhận tiền. |
| Host payout | `POST` | `/api/host/payout-accounts` | `host-payouts.routes.ts` | `createNewPayoutAccount` | Host only | Thêm tài khoản mới. Payload: `bankName`, `bankCode`, `accountName`, `accountNumber`, `isDefault`. |
| Host payout | `PATCH` | `/api/host/payout-accounts/:payoutAccountId` | `host-payouts.routes.ts` | `updateExistingPayoutAccount` | Host only | Sửa tài khoản. |
| Host payout | `DELETE` | `/api/host/payout-accounts/:payoutAccountId` | `host-payouts.routes.ts` | `deleteExistingPayoutAccount` | Host only | Soft delete tài khoản. |
| Host payout | `GET` | `/api/host/payouts` | `host-payouts.routes.ts` | `listHostPayouts` | Host only | Xem payout của host. Query: `status`, `from`, `to`, `page`, `limit`. |
| Admin payout | `GET/POST` | `/api/admin/host-payouts` | `modules/payouts/admin-host-payouts.routes.ts` | payout service | Admin | Tạo/xem payout batch. |
| Admin payout | `PATCH` | `/api/admin/host-payouts/:payoutId/approve` | `admin-host-payouts.routes.ts` | `approveHostPayout` | Admin | Admin khác người tạo duyệt payout pending. |
| Admin payout | `PATCH` | `/api/admin/host-payouts/:payoutId/reject` | `admin-host-payouts.routes.ts` | `rejectHostPayout` | Admin | Từ chối payout. |
| Admin payout | `PATCH` | `/api/admin/host-payouts/:payoutId/paid` | `admin-host-payouts.routes.ts` | `markHostPayoutPaid` | Admin | Admin khác người duyệt đánh dấu đã chuyển tiền. |

## 5. Sơ đồ database chính

| Bảng | Model/Migration | Chức năng | Field quan trọng | Liên kết |
| --- | --- | --- | --- | --- |
| `users` | `backend/src/models/user.ts` | Tài khoản | `user_id`, `username`, `email`, `phone`, `full_name`, `password_hash`, `avatar_url`, `is_email_verified`, `is_host_verified`, `host_application_status`, `status`, `last_login_at`, `deleted_at` | 1 user có nhiều role, booking, listing, wishlist, conversation. |
| `roles` | runtime schema/migration | Danh mục role | `role_id`, `code`, `name`, `created_at`, `updated_at` | Join với `user_role`. |
| `user_role` | runtime schema/migration | Gán role cho user | `user_id`, `role_id`, `assigned_at` | Join `users.user_id` và `roles.role_id`. |
| `refresh_sessions` | auth model/service | Refresh token session | `id`, `session_id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `ip_address`, `user_agent` | Thuộc `users`. |
| `social_accounts` | `backend/src/models/social-account.ts` | Google account | `id`, `user_id`, `provider`, `provider_uid` | Thuộc `users`. |
| `listings` | `backend/src/models/listing.ts` | Villa/chỗ nghỉ | `id`, `listing_id`, `host_id`, `title`, `description`, `address_line`, `city`, `district`, `ward`, `state_region`, `country`, `postal_code`, `latitude`, `longitude`, `property_type`, `room_type`, `max_guests`, `included_guests`, `bedrooms`, `beds`, `bathrooms`, `base_price`, `weekend_price`, `cleaning_fee`, `service_fee_pct`, `extra_guest_fee`, `currency`, `min_nights`, `max_nights`, `check_in_from`, `check_out_before`, `cancellation_policy`, `instant_book_enabled`, `status`, `rejection_reason`, `approved_by`, `approved_at`, `amenity_ids`, `images`, `smoking_allowed`, `pets_allowed`, `party_allowed`, `quiet_hours`, `availability_calendar`, `search_text`, `ai_image_tags`, `ai_image_summary`, `search_embedding_json`, `search_embedding_updated_at`, `deleted_at` | Host là `users.user_id`; liên kết ảnh, amenity, booking. Không có cột `location_group` trong DB. |
| `listing_images` | `backend/src/models/listing-image.ts` | Ảnh listing | `id`, `listing_id`, `url`, `object_key`, `original_filename`, `caption`, `display_title`, `alt_text`, `sort_order`, `is_cover`, `ai_analysis_status`, `ai_image_type`, `ai_scene_tags`, `ai_amenity_tags`, `ai_description`, `ai_confidence`, `ai_quality_warnings`, `ai_error_message`, `ai_analyzed_at` | Thuộc `listings.listing_id`; liên kết AI tables. |
| `amenities` | `backend/src/models/amenity.ts` | Tiện ích | `id`, `amenity_id`, `name`, `icon`, `active`, `is_active`, `deleted_at` | Join qua `listing_amenities`. |
| `listing_amenities` | `backend/src/models/listing-amenity.ts` | Tiện ích của listing | `listing_id`, `amenity_id`, `created_at` | Composite key. |
| `listing_rules` | `backend/src/models/listing-rule.ts` | Quy định nhà | `id`, `listing_id`, `check_in_from`, `check_out_before`, `smoking_allowed`, `pets_allowed`, `party_allowed`, `quiet_hours`, `extra_rules` | Thuộc listing. |
| `availability_calendars` | `backend/src/models/availability-calendar.ts` | Lịch host mở/đóng | `id`, `listing_id`, `date`, `is_available`, `is_blocked_by_host`, `price_override`, `min_nights_override`, `notes` | Unique theo `listing_id,date`. |
| `bookings` | `backend/src/models/booking.ts` | Đơn đặt phòng | `id`, `booking_id`, `listing_id`, `guest_user_id`, `host_user_id`, `check_in_date`, `check_out_date`, `guest_count`, `nights`, `total_nights`, `status`, `version`, `locked_until`, `currency`, `coupon_id`, `subtotal_amount`, `cleaning_fee_amount`, `service_fee_amount`, `discount_amount`, `total_amount`, `price_breakdown_json`, `booking_note`, `cancellation_reason`, `cancelled_by_user_id`, `cancelled_at`, `checked_in_at`, `checked_out_at`, `paid_at` | Liên kết listing, guest, host, payments, locks. Không có field `payment_status` riêng trong bảng bookings. |
| `booking_date_locks` | `backend/src/models/booking-date-lock.ts` | Giữ ngày theo từng đêm | `booking_date_lock_id`, `booking_id`, `listing_id`, `reserved_date`, `status` (default `held`), `released_at` | Cột ngày là `reserved_date`, không phải `date`. |
| `booking_status_history` | `backend/src/models/booking-status-history.ts` | Lịch sử trạng thái booking | `history_id`, `booking_id`, `old_status`, `new_status`, `changed_by_user_id`, `reason`, `metadata_json` | Bảng chỉ có `created_at`, không có `updated_at`. |
| `payments` | `backend/src/models/payment.ts` | Thanh toán | `id`, `payment_id`, `booking_id`, `user_id`, `amount`, `currency`, `method`, `status`, `provider`, `provider_txn_ref`, `provider_transaction_no`, `provider_response_code`, `provider_payload`, `paid_at`, `failed_at`, `refunded_at`, `expires_at`, `expired_at` | Thuộc booking/user. Payment method enum: `vnpay`, `momo`. Status enum: `pending`, `paid`, `failed`, `cancelled`, `expired`, `refunded`. |
| `payment_transactions` | `backend/src/models/payment-transaction.ts` | Log giao dịch provider | `transaction_id`, `payment_id`, `booking_id`, `provider`, `provider_txn_ref`, `transaction_type`, `status`, `raw_payload_json`, `processed_at` | Thuộc payment. |
| `refunds` | `backend/src/models/refund.ts` | Hoàn tiền | `refund_id`, `payment_id`, `booking_id`, `amount`, `status`, `reason`, `provider_ref`, `requested_by_user_id`, `processed_by_user_id` | Sinh khi late payment/cancel cần refund. |
| `coupons` | `backend/src/models/coupon.ts` | Mã giảm giá | `coupon_id`, `code`, `discount_type`, `discount_value`, `max_discount_amount`, `usage_limit`, `per_user_limit`, `status` | Dùng trong booking pricing. |
| `coupon_redemptions` | `backend/src/models/coupon-redemption.ts` | Lượt dùng coupon | `coupon_redemption_id`, `coupon_id`, `booking_id`, `user_id` | Idempotency coupon. |
| `wishlists` | `backend/src/models/wishlist.ts` | Villa đã lưu | `wishlist_id`, `user_id`, `listing_id`, `created_at` | Unique user/listing. |
| `conversation` | `backend/src/models/conversation.ts` | Cuộc chat | `conversation_id`, `created_by_user_id`, `listing_id`, `guest_user_id`, `host_user_id`, `booking_order_id`, `dedupe_key`, `last_message`, `last_message_at` | Bảng số ít, không phải `conversations`. |
| `conversation_participant` | `backend/src/models/conversation-participant.ts` | Thành viên chat | `conversation_id`, `user_id`, `role`, `joined_at`, `last_read_at` | Composite key. |
| `message` | `backend/src/models/message.ts` | Tin nhắn | `message_id`, `conversation_id`, `sender_id`, `content`, `message_type`, `attachments_json` | Bảng số ít, không phải `messages`. |
| `notification_logs` | `backend/src/models/notification-log.ts` | In-app/email notification | `notification_log_id`, `event_type`, `target_type`, `target_id`, `recipient`, `recipient_user_id`, `title`, `body`, `action_url`, `payload_json`, `status`, `provider`, `read_at` | `provider='in_app'` là chuông thông báo UI. |
| `listing_embeddings` | semantic search model/repository | Vector/index metadata | `id`, `listing_id`, `embedding_provider`, `embedding_model`, `embedding_vector`, `qdrant_point_id`, `searchable_text`, `version` | Dùng reindex/search. |
| `search_logs` | semantic search model/repository | Log query AI search | `id`, `user_id`, `query`, `parsed_filters`, `result_listing_ids`, `clicked_listing_id`, `booked_listing_id` | Ghi mỗi lần search. |
| `image_analysis_results` | `backend/src/models/image-analysis-result.ts` | Kết quả AI Vision | `id`, `image_id`, `provider`, `model`, `status`, `caption`, `room_type`, `detected_objects`, `amenities`, `style_tags`, `quality_tags`, `raw_response`, `confidence`, `error_message`, `analyzed_at` | Thuộc `listing_images.id`. |
| `image_tags` | `backend/src/models/image-tag.ts` | Tag ảnh chuẩn hóa | `id`, `image_id`, `listing_id`, `tag`, `tag_group`, `confidence`, `source` | Dùng semantic summary. |
| `host_applications` | `backend/src/models/host-application.ts` | Hồ sơ đăng ký host | `application_id`, `user_id`, `contact_name`, `contact_email`, `contact_phone`, `business_address`, `entity_type`, `status`, `reviewed_by_user_id`, `rejection_reason` | Admin duyệt để cấp role host. |
| `host_identity_documents` | `backend/src/models/host-identity-document.ts` | Giấy tờ host private | `id`, `application_id`, `user_id`, `document_type`, `side`, `object_key`, `mime_type`, `file_size`, `status` | R2 private. |
| `payout_account` | `backend/src/models/payout-account.ts` | Tài khoản nhận tiền host | `payout_account_id`, `user_id`, `bank_name`, `bank_code`, `bank_short_name`, `bank_bin`, `account_name`, `branch_name`, `account_number`, `account_number_encrypted`, `account_number_hash`, `account_number_last4`, `is_default`, `deleted_at` | Thuộc host user. `account_number` được lưu dạng plaintext cho thao tác nội bộ; `account_number_encrypted` là mã hóa bổ sung nếu có. |
| `host_payout_batch` | `backend/src/models/host-payout-batch.ts` | Batch payout | `payout_id`, `host_id`, `payout_account_id`, `amount`, `currency`, `status`, `created_by_user_id`, `approved_by_user_id`, `paid_by_user_id`, `transfer_reference` | Maker-checker admin. |
| `host_payout_booking_item` | `backend/src/models/host-payout-booking-item.ts` | Booking trong payout | `payout_item_id`, `payout_id`, `booking_order_id`, `booking_detail_id`, `amount`, `service_fee_amount`, `host_amount` | Thuộc payout batch. |
| `audit_logs` | `backend/src/models/audit-log.ts` | Audit admin/host action | `id`, `actor_id`, `action`, `target_type`, `target_id`, `metadata_json`, `ip_address`, `user_agent`, `created_at` | Dùng cho duyệt listing, user, payout, report. |

## 6. Luồng đăng ký / đăng nhập

### 6.1. Người dùng thao tác

1. Mở `/dang-ky` hoặc `/dang-nhap`.
2. Nhập email/password, hoặc bấm Google login.
3. Frontend gọi API auth qua `frontend/src/services/authService.ts`.
4. Backend validate payload bằng validator route.
5. Backend tạo/cập nhật user, đọc role từ `roles` + `user_role`, tạo access token và refresh session.
6. Backend set refresh token qua httpOnly cookie tên mặc định `refreshToken`.
7. Frontend lưu access token/user trong auth store và chuyển hướng theo role: admin -> `/admin`, host -> `/chu-nha/cho-nghi`, host new -> `/tro-thanh-host/trang-thai`, user -> `/account/profile`.

### 6.2. API liên quan

| Bước | Method | Endpoint | Payload | Response |
| --- | --- | --- | --- | --- |
| Đăng ký | `POST` | `/api/auth/register` | `email`, `password`, `firstName`, `lastName`, optional `phone` (hoặc `phoneNumber`) | `accessToken`/`token`, `user`, set refresh cookie |
| Đăng nhập | `POST` | `/api/auth/login` | `identifier` (hoặc `emailOrUsername`), `password` | `accessToken`, `user`, set refresh cookie |
| Google | `POST` | `/api/auth/google` | `idToken` | `accessToken`, `user`, set refresh cookie |
| Refresh | `POST` | `/api/auth/refresh` | Cookie refresh token hoặc body/header | Access token mới và user |
| Logout | `POST` | `/api/auth/logout` | Cookie/session hiện tại | Revoke refresh session, clear cookie |
| Me | `GET` | `/api/auth/me` | Bearer token | User hiện tại |
| OTP | `POST` | `/api/auth/send-otp` | `identifier` (email/phone/purpose) | OTP được gửi/log tùy môi trường |
| Xác thực email | `POST` | `/api/auth/verify-email` | `identifier`, `otp` | Email được xác thực |
| Xác thực SĐT | `POST` | `/api/auth/verify-phone` | `identifier`, `otp` | SĐT được xác thực |
| Quên mật khẩu | `POST` | `/api/auth/forgot-password` | `identifier` (email) | Gửi OTP reset |
| Reset mật khẩu | `POST` | `/api/auth/reset-password` | `identifier`, `otp`, `newPassword` (hoặc `password`) | Đổi password, clear auth cookie |

### 6.3. Backend xử lý

| Thành phần | File |
| --- | --- |
| Route | `backend/src/modules/auth/auth.routes.ts` |
| Controller | `backend/src/modules/auth/auth.controller.ts` |
| Service | `backend/src/modules/auth/auth.service.ts`, `google-auth.service.ts`, `token.service.ts` |
| Middleware | `authenticate.middleware.ts`, `require-active-user.middleware.ts`, `require-role.middleware.ts` |
| Model/DB | `users`, `roles`, `user_role`, `refresh_sessions`, `social_accounts` |

### 6.4. Database cần show khi demo

```sql
SELECT
    u.user_id,
    u.email,
    u.full_name,
    u.phone,
    u.is_email_verified,
    u.is_host_verified,
    u.host_application_status,
    u.status,
    u.last_login_at,
    u.created_at,
    u.updated_at
FROM users u
ORDER BY u.created_at DESC
LIMIT 10;
```

```sql
SELECT
    u.user_id,
    u.email,
    GROUP_CONCAT(r.code ORDER BY FIELD(r.code, 'admin', 'moderator', 'host', 'guest')) AS roles
FROM users u
LEFT JOIN user_role ur ON ur.user_id = u.user_id
LEFT JOIN roles r ON r.role_id = ur.role_id
GROUP BY u.user_id, u.email
ORDER BY u.user_id DESC
LIMIT 20;
```

```sql
SELECT
    id,
    session_id,
    user_id,
    expires_at,
    revoked_at,
    ip_address,
    user_agent,
    created_at,
    updated_at
FROM refresh_sessions
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT
    id,
    user_id,
    provider,
    provider_uid,
    created_at,
    updated_at
FROM social_accounts
ORDER BY created_at DESC
LIMIT 20;
```

### 6.5. Kết quả mong đợi

| Kiểm tra | Kết quả đúng |
| --- | --- |
| UI | Header/account menu hiển thị user đã login. |
| Token | Request sau login có `Authorization: Bearer <accessToken>`; refresh cookie httpOnly được set. |
| DB | `users` có record mới, `user_role` có role, `refresh_sessions` có session active. |
| Logout | `refresh_sessions.revoked_at` được set, frontend clear auth state/wishlist queue local. |

## 7. Luồng xem danh sách villa

Người dùng vào `/search` hoặc từ trang chủ bấm tìm. Frontend `SearchPage.tsx` gọi `getListings` trong `frontend/src/services/listingService.ts`, endpoint `GET /api/listings`.

Backend public listing service chỉ trả listing public với `status = 'active'` và `deleted_at IS NULL`. Một số nơi semantic search chấp nhận thêm `approved`/`published` để tương thích dữ liệu cũ, nhưng public API listing thường dùng `active`.

| Lớp | File/chức năng |
| --- | --- |
| UI | `SearchPage.tsx`, `SearchBar`, `StayFilterModal`, `StayGrid` |
| Frontend API | `frontend/src/services/listingService.ts` -> `GET /api/listings` |
| Backend route | `backend/src/modules/listings/listings.routes.ts` |
| Backend service | public listings service, mapper ảnh/amenity/review |
| DB đọc | `listings`, `listing_images`, `amenities`, `listing_amenities`, review summary |

SQL demo:

```sql
SELECT
    listing_id,
    host_id,
    title,
    status,
    city,
    district,
    ward,
    base_price,
    weekend_price,
    max_guests,
    created_at,
    updated_at
FROM listings
WHERE status = 'active'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT
    li.id,
    li.listing_id,
    li.url,
    li.object_key,
    li.sort_order,
    li.is_cover
FROM listing_images li
WHERE li.listing_id IN (
    SELECT listing_id
    FROM listings
    WHERE status = 'active' AND deleted_at IS NULL
)
ORDER BY li.listing_id, li.is_cover DESC, li.sort_order ASC, li.id ASC;
```

## 8. Luồng tìm kiếm thường

### 8.1. Thao tác

1. Mở `/search`.
2. Nhập địa điểm/từ khóa, ví dụ `Bãi Sau`, `hồ bơi`.
3. Chọn ngày check-in/check-out trong tương lai.
4. Chọn số khách.
5. Mở bộ lọc giá/tiện ích/loại chỗ nghỉ nếu cần.
6. Frontend đồng bộ state lên URL params và gọi `GET /api/listings`.

### 8.2. Query params chính

| Param | Ý nghĩa |
| --- | --- |
| `q` | Từ khóa tìm trong title/address/location group/amenity. |
| `city`, `district`, `locationGroup` | Lọc địa điểm. City mặc định hiệu lực là Vũng Tàu nếu không truyền rõ. |
| `checkIn`, `checkOut` | Khoảng ngày, bắt buộc cùng xuất hiện nếu lọc availability. |
| `guests` | Số khách, so với `listings.max_guests`. |
| `propertyType`, `roomType` | Loại chỗ nghỉ/phòng. |
| `priceMin`, `priceMax`, `minPrice`, `maxPrice` | Lọc giá. |
| `amenities` | Danh sách amenity id/code. |
| `lat`, `lng`, `radius` | Tìm trên bản đồ; radius mặc định 800m, tối đa 10000m. |
| `sort` | `price_asc`, `price_desc`, `rating_desc`, `newest`. |
| `page`, `limit` | Phân trang; limit backend giới hạn tối đa 50. |

### 8.3. Backend xử lý

Backend validate ngày:

| Trường hợp | Kết quả |
| --- | --- |
| Thiếu một trong `checkIn/checkOut` | 422 |
| Ngày không đúng ISO | 422 |
| Check-in quá khứ | 422 |
| Checkout <= checkin | 422 |

Availability loại listing nếu có booking active overlap hoặc host block ngày trong `availability_calendars`.

Booking status đang block ngày:

| Status | Có block search/booking không |
| --- | --- |
| `paid`, `confirmed`, `checked_in` | Có |
| `pending_payment` | Có nếu `locked_until > NOW()` |
| `checked_out` | Có cho đến khi qua checkout date |
| `payment_expired`, cancelled/rejected | Không |

### 8.4. SQL kiểm tra

```sql
SELECT
    listing_id,
    title,
    status,
    city,
    district,
    ward,
    base_price,
    max_guests
FROM listings
WHERE status = 'active'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

```sql
SELECT
    booking_id,
    listing_id,
    check_in_date,
    check_out_date,
    guest_count,
    status,
    locked_until,
    total_amount,
    created_at
FROM bookings
WHERE listing_id = <LISTING_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    booking_date_lock_id,
    booking_id,
    listing_id,
    reserved_date,
    status,
    released_at,
    created_at,
    updated_at
FROM booking_date_locks
WHERE listing_id = <LISTING_ID>
ORDER BY reserved_date ASC;
```

```sql
SELECT
    id,
    listing_id,
    date,
    is_available,
    is_blocked_by_host,
    price_override,
    min_nights_override,
    notes,
    updated_at
FROM availability_calendars
WHERE listing_id = <LISTING_ID>
ORDER BY date ASC;
```

### 8.5. Cách demo ngày đã đặt không còn hiện

1. Chọn một listing `active`.
2. Chạy SQL `bookings` và `booking_date_locks` trước khi đặt.
3. Tạo booking trong tương lai.
4. Chạy lại SQL, thấy booking `pending_payment` và locks `held`.
5. Quay lại `/search`, dùng cùng `checkIn/checkOut`; listing đó bị loại nếu hold còn hiệu lực.

## 9. Luồng AI Semantic Search

### 9.1. Thao tác

Người dùng mở `/ai-search`, nhập câu tự nhiên như:

```text
villa bãi sau 10 người có hồ bơi
```

Frontend `AiSearchPage.tsx` gọi `searchAiListings` trong `frontend/src/services/api/semanticSearchApi.ts`.

### 9.2. API và backend

| Thành phần | File |
| --- | --- |
| Frontend page | `frontend/src/views/pages/AiSearch/AiSearchPage.tsx` |
| Frontend API | `frontend/src/services/api/semanticSearchApi.ts` |
| Endpoint chính | `POST /api/search/semantic` |
| Endpoint tương thích | `POST /api/ai/listings/search` |
| Backend route | `backend/src/modules/semantic-search/semantic-search.routes.ts`, `ai-listing-search.routes.ts` |
| Parser | `backend/src/modules/semantic-search/semantic-search.parser.ts` |
| Service | `backend/src/modules/semantic-search/semantic-search.service.ts` |
| Repository/index | semantic search repository, Qdrant client, OpenAI embedding service |
| DB | `listings`, `listing_images`, `amenities`, `listing_amenities`, `availability_calendars`, `bookings`, `listing_embeddings`, `search_logs` |

Backend parse intent:

| Intent | Ví dụ |
| --- | --- |
| Địa điểm | Bãi Sau, trung tâm, gần biển, Vũng Tàu |
| Ngày | cuối tuần này, 20/07-22/07 |
| Giá | dưới 2 triệu, khoảng 1-3 triệu |
| Số khách | 10 người, nhóm bạn |
| Tiện ích | hồ bơi, BBQ, karaoke, bếp |
| Loại chỗ nghỉ | villa, homestay, apartment |

Nếu query không phải ý định tìm chỗ nghỉ, backend trả reason `INVALID_SEARCH_INTENT` thay vì trả toàn bộ villa. Nếu query có thành phố ngoài Vũng Tàu như Nha Trang, backend trả `UNSUPPORTED_LOCATION` và không trả villa Vũng Tàu.

Nếu OpenAI embedding hoặc Qdrant lỗi, backend fallback keyword search và response có `fallback=true`, `mode='keyword_fallback'`.

### 9.3. Demo gợi ý

| Query | Kỳ vọng |
| --- | --- |
| `villa vũng tàu` | Trả listing Vũng Tàu phù hợp. |
| `villa bãi sau có hồ bơi` | Ưu tiên area Bãi Sau và amenity/tag hồ bơi. |
| `villa trung tâm` | Area trung tâm là soft preference trong fallback. |
| `hello` | Không trả toàn bộ villa; reason `INVALID_SEARCH_INTENT`. |
| `villa nha trang` | Không trả villa Vũng Tàu; reason `UNSUPPORTED_LOCATION`. |

### 9.4. SQL kiểm tra

```sql
SELECT
    listing_id,
    title,
    city,
    district,
    ward,
    status,
    ai_image_tags,
    ai_image_summary,
    search_embedding_updated_at,
    updated_at
FROM listings
WHERE status IN ('active', 'approved', 'published')
  AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 20;
```

```sql
SELECT
    id,
    listing_id,
    embedding_provider,
    embedding_model,
    qdrant_point_id,
    version,
    updated_at
FROM listing_embeddings
WHERE listing_id = <LISTING_ID>
ORDER BY updated_at DESC;
```

```sql
SELECT
    id,
    user_id,
    query,
    parsed_filters,
    result_listing_ids,
    clicked_listing_id,
    booked_listing_id,
    created_at
FROM search_logs
ORDER BY created_at DESC
LIMIT 20;
```

## 10. Luồng xem chi tiết villa

### 10.1. Thao tác

1. Người dùng click card villa từ `/search` hoặc `/ai-search`.
2. Frontend chuyển sang `/villa/:villaId`.
3. `ListingDetailPage.tsx` gọi các API detail, review, rules, availability.
4. UI hiển thị gallery, thông tin host, tiện ích, quy định, review, giá, date picker, nút đặt phòng, wishlist, nhắn host.

### 10.2. API

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `GET` | `/api/listings/:listingId` | Chi tiết listing active. |
| `GET` | `/api/listings/:listingId/reviews` | Review. |
| `GET` | `/api/listings/:listingId/rules` | Quy định. |
| `GET` | `/api/listings/:listingId/availability?month=&year=` | Availability từng tháng. |
| `POST` | `/api/wishlist/:listingId` | Lưu villa nếu user login. |
| `POST` | `/api/conversations` | Tạo/mở chat với host. |

### 10.3. DB đọc

`listings`, `listing_images`, `amenities`, `listing_amenities`, `listing_rules`, `availability_calendars`, `bookings`, `reviews`, `users`.

### 10.4. SQL demo

```sql
SELECT *
FROM listings
WHERE listing_id = <LISTING_ID>
  AND deleted_at IS NULL;
```

```sql
SELECT
    id,
    listing_id,
    url,
    object_key,
    caption,
    display_title,
    alt_text,
    sort_order,
    is_cover,
    ai_analysis_status
FROM listing_images
WHERE listing_id = <LISTING_ID>
ORDER BY is_cover DESC, sort_order ASC, id ASC;
```

```sql
SELECT
    la.listing_id,
    la.amenity_id,
    a.name,
    a.icon,
    a.active,
    a.is_active
FROM listing_amenities la
JOIN amenities a ON a.amenity_id = la.amenity_id
WHERE la.listing_id = <LISTING_ID>
ORDER BY a.name ASC;
```

```sql
SELECT *
FROM listing_rules
WHERE listing_id = <LISTING_ID>;
```

## 11. Luồng đặt phòng

### 11.1. Mục tiêu demo

Chứng minh:

| Mục tiêu | Bằng chứng |
| --- | --- |
| Khách chọn villa active | URL `/villa/:villaId`, DB `listings.status='active'`. |
| Chọn ngày hợp lệ | Date picker tương lai, checkout > checkin. |
| Tạo booking thành công | Bảng `bookings` có record mới. |
| Ngày được giữ chỗ | Bảng `booking_date_locks` có từng `reserved_date`. |
| Trạng thái ban đầu | `bookings.status='pending_payment'`, `locked_until` có thời hạn. |
| Payment nếu có | Sau khi bấm thanh toán, bảng `payments` có record `pending`. |

### 11.2. Thao tác trên giao diện

1. Đăng nhập bằng user/customer.
2. Mở `/search`, chọn villa đang active.
3. Vào `/villa/:villaId`.
4. Chọn check-in/check-out trong tương lai.
5. Chọn số khách không vượt `max_guests`.
6. Bấm đặt phòng.
7. Frontend gọi `POST /api/bookings`.
8. Nếu tạo thành công, frontend chuyển sang `/thanh-toan/:bookingId`.
9. Màn thanh toán hiển thị countdown theo `remainingPaymentSeconds`/`locked_until`.

### 11.3. API được gọi

| Bước | Method | Endpoint | Payload chính | Response mong đợi |
| --- | --- | --- | --- | --- |
| Load detail | `GET` | `/api/listings/:listingId` | Path `listingId` | Listing active, ảnh, host, giá. |
| Load availability | `GET` | `/api/listings/:listingId/availability` | `month`, `year` | Ngày available/blocked/booked. |
| Tạo booking | `POST` | `/api/bookings` | `listingId`, `checkIn` hoặc `checkInDate`, `checkOut` hoặc `checkOutDate`, `guests` hoặc `guestCount`, optional `couponCode` | Booking `pending_payment`, `bookingId`, tổng tiền, `lockedUntil`. |
| Xem booking | `GET` | `/api/bookings/:bookingId` | Path `bookingId` | Booking detail cho user sở hữu/host/admin. |
| Tạo payment | `POST` | `/api/payments` | `bookingId`, `method: 'vnpay'|'momo'` | Payment `pending`, `paymentUrl` nếu provider tạo URL. |

### 11.4. Backend xử lý

| Lớp | File/chức năng |
| --- | --- |
| Route | `backend/src/modules/bookings/bookings.routes.ts` |
| Validator | booking validator chấp nhận `checkIn/checkInDate`, `checkOut/checkOutDate`, `guests/guestCount/guestsCount` |
| Controller | `backend/src/modules/bookings/bookings.controller.ts` |
| Service chính | `backend/src/modules/bookings/bookings.service.ts` |
| Pricing | `backend/src/modules/bookings/booking-pricing.service.ts` |
| Date locks | tạo rows `booking_date_locks` trong transaction |
| Status history | ghi `booking_status_history` |
| Notification | `notifyBookingCreated` ghi `notification_logs` |

Các rule backend kiểm tra:

| Rule | Kết quả lỗi |
| --- | --- |
| Checkout <= checkin | 422 |
| Check-in quá khứ | 422 |
| Listing không tồn tại/không active | 404 |
| Host đặt chính listing của mình | 403 |
| `guestCount > maxGuests` | 422 |
| Ngày host block hoặc unavailable | 409 |
| Không đạt min/max nights | 422 |
| Có booking active overlap | 409 |
| Unique lock bị đụng khi đặt đồng thời | 409 |

Khoảng lock là từng đêm `[check_in_date, check_out_date)`, tức ngày checkout không bị lock.

### 11.5. Database ghi gì khi đặt phòng thành công

| Bảng | Ghi/cập nhật |
| --- | --- |
| `bookings` | Tạo booking mới, `status='pending_payment'`, `locked_until = now + PAYMENT_HOLD_MINUTES`, lưu pricing snapshot vào các cột tiền và `price_breakdown_json`. |
| `booking_date_locks` | Tạo 1 row cho mỗi đêm với `reserved_date`, `status='held'`, `released_at=NULL`. |
| `booking_status_history` | Ghi transition ban đầu sang `pending_payment`. |
| `audit_logs` | Ghi action `booking.create`. |
| `notification_logs` | Ghi thông báo booking mới cho khách/host nếu notification context chạy được. |
| `payments` | Chưa tạo ở bước `POST /api/bookings`. Chỉ tạo sau khi user bấm thanh toán và frontend gọi `POST /api/payments`. |

### 11.6. SQL cần mở để demo booking thành công

```sql
-- 1. Xem booking mới nhất
SELECT
    id,
    booking_id,
    listing_id,
    guest_user_id,
    host_user_id,
    check_in_date,
    check_out_date,
    guest_count,
    nights,
    total_nights,
    status,
    version,
    locked_until,
    currency,
    coupon_id,
    subtotal_amount,
    cleaning_fee_amount,
    service_fee_amount,
    discount_amount,
    total_amount,
    booking_note,
    cancellation_reason,
    cancelled_by_user_id,
    cancelled_at,
    checked_in_at,
    checked_out_at,
    paid_at,
    created_at,
    updated_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

```sql
-- 2. Xem booking của một listing cụ thể
SELECT
    booking_id,
    listing_id,
    guest_user_id,
    host_user_id,
    check_in_date,
    check_out_date,
    guest_count,
    status,
    locked_until,
    total_amount,
    created_at
FROM bookings
WHERE listing_id = <LISTING_ID>
ORDER BY created_at DESC;
```

```sql
-- 3. Xem ngày đã bị giữ sau khi đặt
SELECT
    booking_date_lock_id,
    booking_id,
    listing_id,
    reserved_date,
    status,
    released_at,
    created_at,
    updated_at
FROM booking_date_locks
WHERE listing_id = <LISTING_ID>
ORDER BY reserved_date ASC;
```

```sql
-- 4. Xem payment gắn với booking sau khi đã bấm thanh toán
SELECT
    id,
    payment_id,
    booking_id,
    user_id,
    amount,
    currency,
    method,
    status,
    provider,
    provider_txn_ref,
    provider_transaction_no,
    provider_response_code,
    expires_at,
    paid_at,
    failed_at,
    refunded_at,
    expired_at,
    created_at,
    updated_at
FROM payments
WHERE booking_id = <BOOKING_ID>
ORDER BY created_at DESC;
```

```sql
-- 5. Xem lịch sử trạng thái
SELECT
    history_id,
    booking_id,
    old_status,
    new_status,
    changed_by_user_id,
    reason,
    metadata_json,
    created_at
FROM booking_status_history
WHERE booking_id = <BOOKING_ID>
ORDER BY created_at ASC;
```

### 11.7. Cách chứng minh trên demo

1. Trước khi đặt, chạy query `bookings` theo `listing_id` và query `booking_date_locks`.
2. Tạo booking từ UI.
3. Chạy lại query `bookings`, thấy `booking_id` mới nhất.
4. Kiểm tra `status='pending_payment'` và `locked_until` còn tương lai.
5. Chạy query `booking_date_locks`, thấy các `reserved_date` trong khoảng ở.
6. Mở `/thanh-toan/:bookingId`, bấm VNPay/MoMo.
7. Chạy query `payments`, thấy payment `pending`.
8. Quay về `/search`, lọc đúng ngày vừa lock, listing không còn available nếu hold chưa hết hạn.

### 11.8. Trường hợp lỗi cần demo

| Tình huống | Cách demo | Kết quả |
| --- | --- | --- |
| Ngày quá khứ | Chọn check-in trước ngày hiện tại | 422 |
| Checkout <= checkin | Chọn checkout cùng/trước checkin | 422 |
| Ngày đã bị giữ | Đặt lại cùng listing và overlap ngày đang `held` | 409 |
| Quá số khách | Chọn khách > `listings.max_guests` | 422 |
| Host block ngày | Host đóng ngày trong lịch, khách đặt ngày đó | 409 hoặc listing không hiển thị trong search |
| Host tự đặt listing | Login host chủ listing và đặt chính listing đó | 403 |

### 11.9. Trạng thái booking

| Ý nghĩa UI | DB `bookings.status` | Ghi chú |
| --- | --- | --- |
| Chờ thanh toán | `pending_payment` | Booking đã giữ ngày, chờ payment trong thời hạn `locked_until`. |
| Quá hạn thanh toán | `payment_expired` | Job/service expire đã thả locks. |
| Thanh toán thành công | `paid` | Payment paid, booking chờ host xác nhận. |
| Đã xác nhận | `confirmed` | Host/admin xác nhận booking đã paid. |
| Đã nhận phòng | `checked_in` | Host/admin/system check-in. |
| Đã trả phòng | `checked_out` | Host/admin/system check-out. |
| Hoàn tất | `completed` | Kết thúc sau checkout. |
| Khách hủy | `cancelled_by_guest` | Locks được release nếu còn giữ. |
| Host hủy | `cancelled_by_host` | Theo rule service. |
| Admin hủy | `cancelled_by_admin` | Admin can thiệp. |
| Từ chối | `rejected` | Host/admin reject paid booking trước khi confirm. |

## 12. Luồng thanh toán VNPay/MoMo

### 12.1. Thao tác

1. Sau khi booking `pending_payment`, frontend mở `/thanh-toan/:bookingId`.
2. Page `GuestPayment/index.tsx` gọi `GET /api/payments/methods` và `GET /api/bookings/:bookingId`.
3. User chọn VNPay hoặc MoMo.
4. Frontend gọi `POST /api/payments`.
5. Backend tạo/reuse payment pending và trả `paymentUrl`.
6. Browser chuyển sang sandbox/provider.
7. Provider redirect về `/api/payments/vnpay/return` hoặc `/api/payments/momo/return`; IPN/webhook gọi endpoint tương ứng.
8. Backend verify signature/amount, update `payments`, `payment_transactions`, `bookings`.
9. Frontend hiển thị `/thanh-toan/ket-qua`.

### 12.2. API

| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| `GET` | `/api/payments/methods` | Public, cho biết VNPay/MoMo có cấu hình không. |
| `POST` | `/api/payments` | Auth, payload `bookingId`, `method`. |
| `GET` | `/api/payments/my` | Lịch sử payment của user. |
| `GET` | `/api/payments/:paymentId` | Chi tiết payment. |
| `GET` | `/api/payments/vnpay/return` | Return URL VNPay. |
| `POST/GET` | `/api/payments/webhooks/vnpay` | Webhook/IPN VNPay. |
| `GET` | `/api/payments/momo/return` | Return URL MoMo. |
| `POST` | `/api/payments/webhooks/momo` | Webhook/IPN MoMo. |

### 12.3. Backend và DB

| Thành phần | File/bảng |
| --- | --- |
| Route | `backend/src/modules/payments/payments.routes.ts` |
| Validator | `backend/src/modules/payments/payments.validator.ts` |
| Controller | `backend/src/modules/payments/payments.controller.ts` |
| Service | `backend/src/modules/payments/payments.service.ts` |
| DB | `payments`, `payment_transactions`, `bookings`, `booking_status_history`, `refunds`, `notification_logs` |

Payment chỉ được tạo khi booking đang `pending_payment` và hold chưa hết hạn. Nếu đã có payment pending cùng method/amount chưa hết hạn, backend có thể reuse. Nếu có payment pending khác, backend expire payment cũ trước.

### 12.4. SQL kiểm tra

```sql
SELECT
    payment_id,
    booking_id,
    user_id,
    amount,
    currency,
    method,
    status,
    provider,
    provider_txn_ref,
    provider_transaction_no,
    expires_at,
    paid_at,
    failed_at,
    expired_at,
    created_at,
    updated_at
FROM payments
WHERE booking_id = <BOOKING_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    transaction_id,
    payment_id,
    booking_id,
    provider,
    provider_txn_ref,
    provider_transaction_no,
    transaction_type,
    status,
    amount,
    currency,
    raw_payload_json,
    processed_at,
    created_at,
    updated_at
FROM payment_transactions
WHERE booking_id = <BOOKING_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    booking_id,
    status,
    locked_until,
    paid_at,
    updated_at
FROM bookings
WHERE booking_id = <BOOKING_ID>;
```

### 12.5. Demo trước/sau

| Thời điểm | DB đúng |
| --- | --- |
| Sau tạo booking | `bookings.status='pending_payment'`, chưa bắt buộc có row `payments`. |
| Sau bấm thanh toán | `payments.status='pending'`, `payments.provider_txn_ref` có mã provider. |
| Sau callback thành công | `payments.status='paid'`, `payments.paid_at` có giá trị, `bookings.status='paid'`, `bookings.locked_until=NULL`, `bookings.paid_at` có giá trị. |
| Sau host xác nhận | `bookings.status='confirmed'`. |

## 13. Luồng quá hạn thanh toán

Booking hold mặc định theo `PAYMENT_HOLD_MINUTES` trong backend env, fallback code là 15 phút. Service expire chạy từ `backend/src/server.ts` qua `startPaymentExpirationSweep()` với interval `PAYMENT_EXPIRATION_SWEEP_INTERVAL_SECONDS`, fallback 30 giây.

### 13.1. Backend xử lý

| Thành phần | Ghi chú |
| --- | --- |
| Service | Payment expiration service trong modules payments/bookings. |
| Trigger | Background sweep khi server chạy; một số luồng payment cũng gọi expire trong transaction trước khi tạo payment. |
| Điều kiện | Booking `pending_payment` có `locked_until <= NOW()` hoặc fallback quá hạn theo `created_at`. |
| Nếu chưa paid | Payment pending -> `expired`, booking -> `payment_expired`, release locks. |
| Nếu payment paid kịp | Booking -> `paid`, clear `locked_until`. |
| Late paid sau expired | Booking vẫn expired/release locks, tạo `refunds` pending/manual review. |

### 13.2. SQL demo

```sql
SELECT
    booking_id,
    listing_id,
    status,
    locked_until,
    cancellation_reason,
    created_at,
    updated_at
FROM bookings
WHERE status IN ('pending_payment', 'payment_expired')
ORDER BY created_at DESC;
```

```sql
SELECT
    booking_date_lock_id,
    booking_id,
    listing_id,
    reserved_date,
    status,
    released_at
FROM booking_date_locks
WHERE booking_id = <BOOKING_ID>
ORDER BY reserved_date ASC;
```

```sql
SELECT
    payment_id,
    booking_id,
    method,
    status,
    expires_at,
    expired_at,
    failed_at,
    updated_at
FROM payments
WHERE booking_id = <BOOKING_ID>
ORDER BY created_at DESC;
```

## 14. Luồng host đăng villa

### 14.1. Thao tác

1. Host đăng nhập.
2. Mở `/chu-nha/cho-nghi`.
3. Bấm thêm chỗ nghỉ -> `/chu-nha/cho-nghi/them-moi`.
4. Nhập thông tin: tiêu đề, mô tả, địa chỉ Vũng Tàu, loại nhà/phòng, giá, số khách, phòng ngủ, tiện ích, quy định.
5. Upload ảnh qua R2.
6. Submit dạng draft hoặc gửi duyệt.
7. Backend tạo listing với `status='draft'` hoặc `status='pending_approval'`.
8. Admin/moderator duyệt để listing thành `active`.

### 14.2. API và backend

| Lớp | File |
| --- | --- |
| UI | `frontend/src/views/pages/Host/ThemChoNghi/index.tsx` |
| Frontend service | `frontend/src/services/hostService.ts` |
| Route | `backend/src/modules/host-listings/host-listings.routes.ts` |
| Service | `backend/src/modules/host-listings/host-listings.service.ts` |
| DB | `listings`, `listing_images`, `listing_amenities`, `listing_rules`, `availability_calendars`, `audit_logs`, `notification_logs` |

Các route host listing chính:

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/api/host/listings` | Tạo listing mới. Status mặc định `draft` hoặc `pending_approval`. |
| `GET` | `/api/host/listings/mine` | Danh sách listing của host. Query: `status`, `page`, `limit`. |
| `GET` | `/api/host/listings/:listingId` | Xem chi tiết listing. |
| `PATCH` | `/api/host/listings/:listingId` | Sửa thông tin listing. Sửa field nhạy cảm khi đang public sẽ chuyển về `pending_approval`. |
| `DELETE` | `/api/host/listings/:listingId` | Soft delete listing. |
| `PUT` | `/api/host/listings/:listingId/amenities` | Thay thế toàn bộ amenity của listing. Payload: `amenityIds` (array). |
| `PATCH` | `/api/host/listings/:listingId/rules` | Cập nhật quy định nhà. Payload: `checkInFrom`, `checkOutBefore`, `smokingAllowed`, `petsAllowed`, `partyAllowed`, `quietHours`. |

Host listing service ép/validate location trong Vũng Tàu. Khi host sửa field nhạy cảm của listing đang public, service đưa status về `pending_approval` để admin duyệt lại.

### 14.3. SQL demo

```sql
SELECT
    listing_id,
    host_id,
    title,
    status,
    city,
    district,
    ward,
    address_line,
    base_price,
    max_guests,
    rejection_reason,
    approved_by,
    approved_at,
    created_at,
    updated_at
FROM listings
WHERE host_id = <HOST_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    id,
    listing_id,
    url,
    object_key,
    original_filename,
    sort_order,
    is_cover,
    created_at
FROM listing_images
WHERE listing_id = <LISTING_ID>
ORDER BY sort_order ASC, id ASC;
```

```sql
SELECT *
FROM listing_rules
WHERE listing_id = <LISTING_ID>;
```

## 15. Luồng host upload ảnh và AI Vision

### 15.1. Thao tác

1. Trong form `ThemChoNghi`, host chọn ảnh.
2. Frontend gọi `POST /api/uploads/presign`.
3. Frontend PUT file trực tiếp lên `uploadUrl` R2.
4. Frontend gọi `POST /api/host/listings/:listingId/images` để lưu metadata `url`, `objectKey`, `caption`, `sortOrder`, `isCover`.
5. Frontend gọi phân tích ảnh `POST /api/host/listings/:listingId/images/:imageId/analyze` hoặc analyze all.
6. Backend gọi OpenAI Vision, ghi kết quả vào `image_analysis_results`, `image_tags`, cập nhật AI fields trên `listing_images` và summary trên `listings`.

### 15.2. API

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/api/uploads/presign` | Lấy presigned upload URL; folder hợp lệ gồm `listings`, `avatars`, `verifications`, `misc`. |
| `POST` | `/api/host/listings/:listingId/images` | Lưu metadata ảnh sau khi upload lên R2. |
| `PATCH` | `/api/host/listings/:listingId/images/:imageId/cover` | Đặt ảnh cover. |
| `DELETE` | `/api/host/listings/:listingId/images/:imageId` | Xóa ảnh theo listingId và imageId (host-listings routes). |
| `POST` | `/api/host/listings/:listingId/images/:imageId/analyze` | Phân tích 1 ảnh bằng AI Vision (hostListingImageVisionRoutes). |
| `GET` | `/api/host/listings/:listingId/images/analysis` | Lấy kết quả phân tích ảnh của listing (hostListingImageVisionRoutes). |
| `POST` | `/api/ai/listings/:listingId/analyze-images` | Phân tích nhiều ảnh, có thể force (route `/api/ai/listings`). |
| `PATCH` | `/api/host/images/:imageId/tags` | Host chỉnh tag ảnh (hostImageVisionRoutes). |
| `DELETE` | `/api/host/images/:imageId` | Host xóa ảnh theo imageId trực tiếp (hostImageVisionRoutes). |
| `POST` | `/api/admin/images/:imageId/reanalyze` | Admin phân tích lại ảnh (adminImageVisionRoutes). |

### 15.3. DB và trạng thái

| Trạng thái | Ý nghĩa |
| --- | --- |
| `listing_images.ai_analysis_status='pending'` | Đang phân tích. |
| `analyzed` | Có caption/tag/description/confidence. |
| `failed` | Có `ai_error_message`; thường do thiếu `OPENAI_API_KEY`, ảnh không đọc được, lỗi OpenAI/R2. |

### 15.4. SQL demo

```sql
SELECT
    id,
    listing_id,
    url,
    object_key,
    is_cover,
    ai_analysis_status,
    ai_image_type,
    ai_scene_tags,
    ai_amenity_tags,
    ai_description,
    ai_confidence,
    ai_error_message,
    ai_analyzed_at,
    created_at,
    updated_at
FROM listing_images
WHERE listing_id = <LISTING_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    id,
    image_id,
    provider,
    model,
    status,
    caption,
    room_type,
    confidence,
    error_message,
    analyzed_at,
    created_at,
    updated_at
FROM image_analysis_results
WHERE image_id = <IMAGE_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    id,
    image_id,
    listing_id,
    tag,
    tag_group,
    confidence,
    source,
    created_at
FROM image_tags
WHERE image_id = <IMAGE_ID>
ORDER BY tag_group, tag;
```

```sql
SELECT
    listing_id,
    title,
    ai_image_tags,
    ai_image_summary,
    search_embedding_updated_at,
    updated_at
FROM listings
WHERE listing_id = <LISTING_ID>;
```

## 16. Luồng host quản lý lịch lưu trú

### 16.1. Thao tác

1. Host mở `/chu-nha/lich-luu-tru`.
2. Chọn listing, tháng/năm.
3. Frontend gọi `GET /api/host/listings/:listingId/calendar`.
4. Host chọn ngày và bấm mở/đóng.
5. Frontend gọi `PATCH /api/host/listings/:listingId/calendar/bulk`.
6. Backend không cho sửa ngày quá khứ hoặc đóng ngày đã có booking active.
7. DB ghi/upsert `availability_calendars`.
8. Search/booking sẽ đọc bảng này để loại ngày bị block.

### 16.2. API

| Method | Endpoint | Payload/query |
| --- | --- | --- |
| `GET` | `/api/host/listings/:listingId/calendar` | `month`, `year` |
| `PATCH` | `/api/host/listings/:listingId/calendar/bulk` | `dates`, `isAvailable`, `isBlockedByHost`, optional `priceOverride`, `minNightsOverride`, `notes` |

### 16.3. SQL demo

```sql
SELECT
    id,
    listing_id,
    date,
    is_available,
    is_blocked_by_host,
    price_override,
    min_nights_override,
    notes,
    created_at,
    updated_at
FROM availability_calendars
WHERE listing_id = <LISTING_ID>
ORDER BY date ASC;
```

Demo:

1. Chạy SQL trước khi đóng ngày X.
2. Host đóng ngày X.
3. Chạy lại SQL, thấy `is_available=0` hoặc `is_blocked_by_host=1`.
4. Khách search/đặt ngày X, listing không available hoặc booking trả 409.
5. Host mở lại ngày X.
6. Chạy lại SQL, thấy record cập nhật hoặc bị xóa/đưa về available tùy payload.

## 17. Luồng Admin/Moderator duyệt listing

### 17.1. Thao tác

1. Host tạo listing `pending_approval`.
2. Admin mở `/admin/kiem-duyet`.
3. Frontend gọi `GET /api/admin/listings/pending`.
4. Admin bấm approve hoặc reject.
5. Backend update `listings.status`.
6. Nếu approve, listing public khi `status='active'`.

### 17.2. Quyền

Backend route cho phép `admin` và `moderator` ở admin listing routes. Frontend hiện bọc `/admin/*` bằng `ProtectedRoute allowedRoles={["Admin"]}`, nên moderator không vào được màn hình admin qua UI mặc định. Nếu muốn demo moderator duyệt listing qua UI, cần kiểm tra lại luồng phân quyền frontend thực tế.

### 17.3. API và DB

| Method | Endpoint | Kết quả |
| --- | --- | --- |
| `GET` | `/api/admin/listings/pending` | Listing status `pending_approval`. |
| `GET` | `/api/admin/listings/:listingId` | Chi tiết listing. |
| `PATCH` | `/api/admin/listings/:listingId/approve` | `status='active'`, set `approved_by`, `approved_at`, clear `rejection_reason`. |
| `PATCH` | `/api/admin/listings/:listingId/reject` | `status='rejected'`, set `rejection_reason`. |

```sql
SELECT
    listing_id,
    title,
    host_id,
    status,
    rejection_reason,
    approved_by,
    approved_at,
    updated_at
FROM listings
WHERE listing_id = <LISTING_ID>;
```

```sql
SELECT
    id,
    actor_id,
    action,
    target_type,
    target_id,
    metadata_json,
    created_at
FROM audit_logs
WHERE target_type = 'listing'
  AND target_id = <LISTING_ID>
ORDER BY created_at DESC;
```

## 18. Luồng Wishlist

### 18.1. Thao tác

1. User login.
2. Bấm icon lưu trên card hoặc detail villa.
3. Frontend gọi `POST /api/wishlist/:listingId`.
4. Backend chỉ cho lưu listing `active` và chưa `deleted`.
5. User mở `/yeu-thich`, frontend gọi `GET /api/wishlist`.
6. Nếu listing bị ẩn/không active, service trả `invalidListingIds` và không hiển thị trong items hợp lệ.

### 18.2. API và DB

| Method | Endpoint | DB |
| --- | --- | --- |
| `GET` | `/api/wishlist` | Đọc `wishlists`, join listing active. |
| `POST` | `/api/wishlist/:listingId` | `findOrCreate` row `wishlists`. |
| `DELETE` | `/api/wishlist/:listingId` | Xóa row theo user/listing. |

```sql
SELECT
    wishlist_id,
    user_id,
    listing_id,
    created_at,
    updated_at
FROM wishlists
WHERE user_id = <USER_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    w.wishlist_id,
    w.user_id,
    w.listing_id,
    l.title,
    l.status,
    l.deleted_at
FROM wishlists w
JOIN listings l ON l.listing_id = w.listing_id
WHERE w.user_id = <USER_ID>
ORDER BY w.created_at DESC;
```

## 19. Luồng Chat

### 19.1. Thao tác

1. User bấm nhắn host từ detail villa.
2. Frontend gọi `POST /api/conversations` với `listingId`.
3. Backend lấy `listings.host_id`, không cho user nhắn chính mình.
4. Backend tạo hoặc reuse conversation bằng `dedupe_key`.
5. User/host gửi tin nhắn qua `POST /api/conversations/:conversationId/messages`.
6. Message được lưu DB và phát Socket.IO `emitMessageNew`.
7. Mở `/messages` cho khách hoặc `/host/tin-nhan` cho host để xem.

### 19.2. API

| Method | Endpoint | Payload/query |
| --- | --- | --- |
| `GET` | `/api/conversations` | `page`, `limit`, `unreadOnly`, `scope=guest|host` |
| `POST` | `/api/conversations` | `listingId` hoặc `bookingId` hoặc `participantId/hostUserId`, optional `firstMessage` |
| `GET` | `/api/conversations/:conversationId/messages` | `page`, `limit` |
| `POST` | `/api/conversations/:conversationId/messages` | `content`, optional `messageType`, `attachments` |
| `PATCH` | `/api/conversations/:conversationId/read` | Mark read |

### 19.3. SQL demo

```sql
SELECT
    conversation_id,
    created_by_user_id,
    listing_id,
    guest_user_id,
    host_user_id,
    booking_order_id,
    dedupe_key,
    last_message,
    last_message_at,
    created_at,
    updated_at
FROM conversation
ORDER BY updated_at DESC
LIMIT 10;
```

```sql
SELECT
    conversation_id,
    user_id,
    role,
    joined_at,
    last_read_at
FROM conversation_participant
WHERE conversation_id = <CONVERSATION_ID>
ORDER BY user_id ASC;
```

```sql
SELECT
    message_id,
    conversation_id,
    sender_id,
    message_type,
    content,
    attachments_json,
    created_at,
    updated_at
FROM message
WHERE conversation_id = <CONVERSATION_ID>
ORDER BY created_at ASC, message_id ASC;
```

## 20. Luồng Notification

### 20.1. Khi nào phát sinh

Notification service ghi cả in-app notification và log email SMTP vào `notification_logs`.

Event chính:

`USER_REGISTERED`, `HOST_APPLICATION_SUBMITTED`, `LISTING_SUBMITTED`, `LISTING_APPROVED`, `LISTING_REJECTED`, `BOOKING_CREATED`, `PAYMENT_PENDING`, `PAYMENT_SUCCESS`, `PAYMENT_EXPIRED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `REFUND_CREATED`, `PAYOUT_CREATED`, `REVIEW_CREATED`.

Frontend `NotificationBell.tsx` gọi `frontend/src/services/notificationService.ts`.

### 20.2. API

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `GET` | `/api/notifications?page=&limit=&unreadOnly=` | Lấy notification in-app của user. |
| `PATCH` | `/api/notifications/:id/read` | Đánh dấu đã đọc 1 notification. |
| `PATCH` | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc. |

### 20.3. SQL demo

```sql
SELECT
    notification_log_id,
    event_type,
    target_type,
    target_id,
    recipient,
    recipient_user_id,
    title,
    body,
    action_url,
    status,
    provider,
    read_at,
    sent_at,
    created_at
FROM notification_logs
WHERE recipient_user_id = <USER_ID>
  AND provider = 'in_app'
ORDER BY created_at DESC;
```

```sql
SELECT
    notification_log_id,
    event_type,
    recipient,
    status,
    provider,
    provider_message_id,
    error_message,
    sent_at,
    created_at
FROM notification_logs
WHERE provider = 'smtp'
ORDER BY created_at DESC
LIMIT 20;
```

## 21. Luồng Payout

### 21.1. Tài khoản nhận tiền của host

Host mở `/chu-nha/thanh-toan`, frontend `payoutService.ts` gọi:

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `GET` | `/api/host/payout-accounts` | Danh sách tài khoản nhận tiền. |
| `POST` | `/api/host/payout-accounts` | Thêm tài khoản: `bankName`, `bankCode`, `accountName`, `accountNumber`, `isDefault`. |
| `PATCH` | `/api/host/payout-accounts/:payoutAccountId` | Sửa tài khoản. |
| `DELETE` | `/api/host/payout-accounts/:payoutAccountId` | Soft delete. |
| `GET` | `/api/host/payouts` | Host xem payout của mình. |

### 21.2. Admin payout

Admin dùng `/api/admin/host-payouts`:

| Bước | Rule |
| --- | --- |
| Tạo payout | Admin tạo batch cho host, booking phải thuộc host, booking `checked_out` hoặc `completed`, payment `paid`. |
| Chống duplicate | Booking đã nằm trong payout `pending/approved/processing/paid` không được tạo lại. |
| Amount | `amount` phải bằng tổng `hostAmount = total_amount - service_fee_amount`. |
| Approve | Chỉ payout `pending`; admin tạo payout không được tự approve. |
| Reject | Payout `pending` hoặc `approved`, cần reason. |
| Mark paid | Chỉ payout `approved`; admin đã approve không được tự mark paid; cần `transferReference`. |

### 21.3. SQL demo

```sql
SELECT
    payout_account_id,
    user_id,
    bank_name,
    bank_code,
    bank_short_name,
    bank_bin,
    account_name,
    branch_name,
    account_number_last4,
    is_default,
    deleted_at,
    created_at,
    updated_at
FROM payout_account
WHERE user_id = <HOST_ID>
ORDER BY is_default DESC, created_at DESC;
```

```sql
SELECT
    payout_id,
    host_id,
    payout_account_id,
    amount,
    currency,
    status,
    notes,
    created_by_user_id,
    approved_by_user_id,
    approved_at,
    rejected_by_user_id,
    rejected_at,
    rejection_reason,
    paid_by_user_id,
    paid_at,
    transfer_reference,
    created_at,
    updated_at
FROM host_payout_batch
ORDER BY created_at DESC
LIMIT 10;
```

```sql
SELECT
    payout_item_id,
    payout_id,
    booking_order_id,
    booking_detail_id,
    amount,
    currency,
    service_fee_amount,
    host_amount,
    created_at
FROM host_payout_booking_item
WHERE payout_id = <PAYOUT_ID>
ORDER BY payout_item_id ASC;
```

## 22. Checklist demo tổng thể

### Demo 1: Tìm villa

- Mở `/search`.
- Nhập `villa bãi sau`.
- Chọn ngày tương lai và số khách.
- Show kết quả card villa.
- Show Network `GET /api/listings`.
- Show SQL `listings` + `listing_images`.

### Demo 2: Đặt phòng thành công

- Mở `/villa/:villaId` của listing active.
- Chọn ngày chưa bị block và số khách hợp lệ.
- Bấm đặt phòng.
- Show URL chuyển sang `/thanh-toan/:bookingId`.
- Show DB `bookings` có row `pending_payment`.
- Show DB `booking_date_locks` có `reserved_date`.
- Show DB `payments` chưa có hoặc chưa cần có cho đến khi bấm thanh toán.
- Quay lại search cùng ngày để chứng minh listing đã bị giữ chỗ nếu hold còn hạn.

### Demo 3: Thanh toán thành công

- Từ `/thanh-toan/:bookingId`, chọn VNPay hoặc MoMo.
- Bấm thanh toán.
- Show DB `payments.status='pending'`.
- Hoàn tất sandbox/callback.
- Show DB `payments.status='paid'`.
- Show DB `bookings.status='paid'`, `paid_at` có giá trị.

### Demo 4: Host đóng lịch

- Host mở `/chu-nha/lich-luu-tru`.
- Chọn listing và đóng ngày X.
- Show DB `availability_calendars` có ngày X bị block.
- Khách search/đặt ngày X và không đặt được.
- Host mở lại ngày X, show DB cập nhật.

### Demo 5: Admin duyệt listing

- Host tạo listing `pending_approval`.
- Admin mở `/admin/kiem-duyet`.
- Approve listing.
- Show DB `listings.status='active'`, `approved_at` có giá trị.
- Search public thấy listing.

### Demo 6: AI Vision

- Host upload ảnh listing.
- Show DB `listing_images.ai_analysis_status` ban đầu.
- Bấm phân tích ảnh.
- Show DB `image_analysis_results`, `image_tags`.
- Show `listings.ai_image_tags` và `ai_image_summary`.

### Demo 7: AI Search

- Mở `/ai-search`.
- Query `villa bãi sau có hồ bơi`.
- Show kết quả và `matchedReasons` nếu UI hiển thị.
- Query `hello`, show không trả toàn bộ villa.
- Query `villa nha trang`, show không trả villa Vũng Tàu.
- Show DB `search_logs`.

### Demo 8: Notification

- Tạo booking hoặc approve listing.
- Mở chuông notification trên header/topbar.
- Show DB `notification_logs` với `provider='in_app'`.
- Bấm đọc, show `read_at` được set.

### Demo 9: Payout

- Chuẩn bị booking `checked_out` hoặc `completed` có payment `paid`.
- Host thêm payout account.
- Admin tạo payout batch.
- Admin khác approve.
- Admin khác người approve mark paid.
- Show `host_payout_batch` và `host_payout_booking_item`.

## 23. Các query SQL tổng hợp cần chuẩn bị trước demo

### User

```sql
SELECT
    u.user_id,
    u.email,
    u.full_name,
    u.phone,
    u.status,
    u.is_email_verified,
    u.is_host_verified,
    u.host_application_status,
    GROUP_CONCAT(r.code ORDER BY FIELD(r.code, 'admin', 'moderator', 'host', 'guest')) AS roles,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN user_role ur ON ur.user_id = u.user_id
LEFT JOIN roles r ON r.role_id = ur.role_id
GROUP BY u.user_id
ORDER BY u.created_at DESC
LIMIT 20;
```

### Listings

```sql
SELECT
    listing_id,
    host_id,
    title,
    status,
    city,
    district,
    ward,
    base_price,
    max_guests,
    ai_image_tags,
    ai_image_summary,
    created_at,
    updated_at
FROM listings
WHERE deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 20;
```

```sql
SELECT
    id,
    listing_id,
    url,
    object_key,
    sort_order,
    is_cover,
    ai_analysis_status,
    created_at
FROM listing_images
WHERE listing_id = <LISTING_ID>
ORDER BY is_cover DESC, sort_order ASC, id ASC;
```

### Bookings

```sql
SELECT
    booking_id,
    listing_id,
    guest_user_id,
    host_user_id,
    check_in_date,
    check_out_date,
    guest_count,
    status,
    locked_until,
    total_amount,
    paid_at,
    cancelled_at,
    created_at,
    updated_at
FROM bookings
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT
    booking_date_lock_id,
    booking_id,
    listing_id,
    reserved_date,
    status,
    released_at,
    created_at
FROM booking_date_locks
WHERE listing_id = <LISTING_ID>
ORDER BY reserved_date ASC;
```

### Payments

```sql
SELECT
    payment_id,
    booking_id,
    user_id,
    method,
    status,
    provider,
    provider_txn_ref,
    provider_transaction_no,
    amount,
    currency,
    expires_at,
    paid_at,
    expired_at,
    created_at,
    updated_at
FROM payments
WHERE booking_id = <BOOKING_ID>
ORDER BY created_at DESC;
```

### Calendar

```sql
SELECT
    id,
    listing_id,
    date,
    is_available,
    is_blocked_by_host,
    price_override,
    min_nights_override,
    notes,
    updated_at
FROM availability_calendars
WHERE listing_id = <LISTING_ID>
ORDER BY date ASC;
```

### Images / AI Vision

```sql
SELECT
    id,
    image_id,
    provider,
    model,
    status,
    caption,
    room_type,
    confidence,
    error_message,
    analyzed_at,
    created_at
FROM image_analysis_results
WHERE image_id = <IMAGE_ID>
ORDER BY created_at DESC;
```

```sql
SELECT
    id,
    image_id,
    listing_id,
    tag,
    tag_group,
    confidence,
    source,
    created_at
FROM image_tags
WHERE image_id = <IMAGE_ID>
ORDER BY tag_group, tag;
```

### Semantic Search

```sql
SELECT
    id,
    listing_id,
    embedding_provider,
    embedding_model,
    qdrant_point_id,
    version,
    updated_at
FROM listing_embeddings
ORDER BY updated_at DESC
LIMIT 20;
```

```sql
SELECT
    id,
    user_id,
    query,
    parsed_filters,
    result_listing_ids,
    created_at
FROM search_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Wishlist

```sql
SELECT
    wishlist_id,
    user_id,
    listing_id,
    created_at
FROM wishlists
WHERE user_id = <USER_ID>
ORDER BY created_at DESC;
```

### Chat

```sql
SELECT
    conversation_id,
    listing_id,
    guest_user_id,
    host_user_id,
    booking_order_id,
    last_message,
    last_message_at,
    updated_at
FROM conversation
ORDER BY updated_at DESC
LIMIT 10;
```

```sql
SELECT
    message_id,
    conversation_id,
    sender_id,
    message_type,
    content,
    created_at
FROM message
WHERE conversation_id = <CONVERSATION_ID>
ORDER BY created_at ASC;
```

### Notifications

```sql
SELECT
    notification_log_id,
    event_type,
    target_type,
    target_id,
    recipient_user_id,
    title,
    status,
    provider,
    read_at,
    created_at
FROM notification_logs
WHERE recipient_user_id = <USER_ID>
ORDER BY created_at DESC;
```

### Host application

```sql
SELECT
    application_id,
    user_id,
    contact_name,
    contact_email,
    contact_phone,
    business_address,
    entity_type,
    status,
    reviewed_by_user_id,
    reviewed_at,
    rejection_reason,
    created_at,
    updated_at
FROM host_applications
ORDER BY created_at DESC
LIMIT 20;
```

```sql
SELECT
    id,
    application_id,
    user_id,
    document_type,
    side,
    object_key,
    mime_type,
    file_size,
    status,
    created_at
FROM host_identity_documents
WHERE application_id = <APPLICATION_ID>
ORDER BY created_at ASC;
```

### Payout

```sql
SELECT
    payout_id,
    host_id,
    payout_account_id,
    amount,
    currency,
    status,
    created_by_user_id,
    approved_by_user_id,
    approved_at,
    paid_by_user_id,
    paid_at,
    transfer_reference,
    created_at
FROM host_payout_batch
ORDER BY created_at DESC
LIMIT 10;
```

## 24. Các lỗi thường gặp khi demo và cách xử lý

| Lỗi | Dấu hiệu | Nguyên nhân có thể | Cách kiểm tra |
| --- | --- | --- | --- |
| Không thấy villa khi search | `/search` trống | Listing không `active`, `deleted_at` khác null, sai Vũng Tàu/locationGroup, ngày bị block/booked | Query `listings`, `availability_calendars`, `bookings`, `booking_date_locks`. |
| Booking 422 do ngày | Toast/API lỗi validation | Check-in quá khứ, checkout <= checkin, thiếu 1 trong 2 ngày | Xem Network response; kiểm tra payload `checkIn/checkOut`. |
| Booking 409 do overlap | API `POST /api/bookings` trả 409 | Có booking active hoặc lock đang held | Query `bookings` và `booking_date_locks` theo `listing_id`. |
| Không tạo được booking | 404 listing not found | Listing không `active` hoặc bị soft delete | Query `listings WHERE listing_id=<id>`. |
| Payment không tạo URL | UI báo phương thức không khả dụng | Thiếu env VNPay/MoMo hoặc booking không còn payable | `GET /api/payments/methods`, query `bookings.status/locked_until`. |
| Payment sandbox không callback | Payment vẫn pending | Sai return URL/IPN URL, signature/env provider sai, provider chưa gọi webhook | Query `payments`, `payment_transactions`; xem backend log callback. |
| Booking hết hạn | UI countdown hết, không bấm pay được | `locked_until` quá hạn, sweep đã chuyển `payment_expired` | Query `bookings`, `booking_date_locks`, `payments`. |
| AI Vision failed | `ai_analysis_status='failed'` | Thiếu `OPENAI_API_KEY`, R2 object không đọc được, OpenAI lỗi | Query `listing_images.ai_error_message`, `image_analysis_results.error_message`; kiểm tra env. |
| AI Search fallback | Response `fallback=true` | OpenAI/Qdrant lỗi hoặc score thấp | Query `search_logs`; chạy `npm run qdrant:check`; kiểm tra `OPENAI_API_KEY`. |
| R2 ảnh không hiện | Ảnh broken trên UI | `R2_PUBLIC_BASE_URL` sai, CORS bucket, object key sai | Query `listing_images.url/object_key`; mở URL trực tiếp. |
| Google login lỗi | Không login được bằng Google | Thiếu/sai `VITE_GOOGLE_CLIENT_ID` hoặc `GOOGLE_CLIENT_ID` | Kiểm tra frontend env và backend env; Network `POST /api/auth/google`. |
| Backend CORS lỗi | Browser chặn request | `CLIENT_URL/CORS_ORIGINS` thiếu origin frontend | Kiểm tra response CORS header và env. |
| Refresh token hết hạn | Bị logout/401 sau refresh | `refresh_sessions.expires_at` hết hạn hoặc `revoked_at` đã set | Query `refresh_sessions` theo `user_id`. |
| Notification không hiện | Chuông trống | Không có `provider='in_app'`, user không đúng recipient, socket chưa connect | Query `notification_logs`; gọi `GET /api/notifications`. |
| Host không vào được host page | Redirect/403 | User chưa có role `host` hoặc host application chưa approved | Query `roles/user_role`, `users.is_host_verified`, `host_applications`. |
| Payout tạo fail | 409/422 | Booking chưa `checked_out/completed`, payment chưa `paid`, amount sai, duplicate payout | Query `bookings`, `payments`, `host_payout_booking_item`. |

## 25. Phụ lục: Mapping trạng thái booking

| UI Label | DB booking status | Payment status | Ý nghĩa | Được chuyển tiếp sang |
| --- | --- | --- | --- | --- |
| Chờ thanh toán | `pending_payment` | Chưa có payment hoặc `pending` | Booking giữ chỗ tạm trong thời hạn `locked_until`. | `paid`, `payment_expired`, `cancelled_by_guest`, `cancelled_by_admin` |
| Quá hạn thanh toán | `payment_expired` | `expired` hoặc payment không tồn tại | Hold hết hạn, locks đã release. | Không tiếp tục booking cũ; khách tạo booking mới. |
| Thanh toán thành công | `paid` | `paid` | Tiền đã nhận, chờ host xác nhận. | `confirmed`, `rejected`, `cancelled_by_guest`, `cancelled_by_admin` |
| Đã xác nhận | `confirmed` | `paid` | Host/admin xác nhận booking. | `checked_in`, `cancelled_by_guest`, `cancelled_by_host`, `cancelled_by_admin` |
| Đã nhận phòng | `checked_in` | `paid` | Khách đã check-in. | `checked_out`, `cancelled_by_admin` |
| Đã trả phòng | `checked_out` | `paid` | Khách đã check-out, có thể chờ hoàn tất/payout. | `completed` |
| Hoàn tất | `completed` | `paid` | Booking kết thúc. | Payout/review/report tùy nghiệp vụ. |
| Đã hủy bởi khách | `cancelled_by_guest` | `cancelled`, `refunded` hoặc tùy payment | Khách hủy. | Refund nếu đủ điều kiện. |
| Đã hủy bởi host | `cancelled_by_host` | `cancelled`, `refunded` hoặc tùy payment | Host hủy booking. | Refund nếu đã paid. |
| Đã hủy bởi admin | `cancelled_by_admin` | `cancelled`, `refunded` hoặc tùy payment | Admin hủy. | Refund/manual review nếu cần. |
| Bị từ chối | `rejected` | Thường `paid` trước khi refund/cancel | Host/admin từ chối booking đã thanh toán trước confirm. | Refund/manual xử lý. |

Payment enum thật: `pending`, `paid`, `failed`, `cancelled`, `expired`, `refunded`.

## 26. Phụ lục: File quan trọng cần nhớ

| Nghiệp vụ | Frontend file | Backend route/controller/service | Model/DB |
| --- | --- | --- | --- |
| Auth | `frontend/src/services/authService.ts`, `views/pages/Auth/*`, `router/ProtectedRoute.tsx` | `modules/auth/auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `google-auth.service.ts`, `token.service.ts` | `users`, `roles`, `user_role`, `refresh_sessions`, `social_accounts` |
| Search thường | `views/pages/Search/SearchPage.tsx`, `services/listingService.ts` | `modules/listings/listings.routes.ts`, public listing service | `listings`, `listing_images`, `amenities`, `listing_amenities`, `bookings`, `availability_calendars` |
| AI Search | `views/pages/AiSearch/AiSearchPage.tsx`, `services/api/semanticSearchApi.ts` | `modules/semantic-search/*` | `listing_embeddings`, `search_logs`, `listings`, `image_tags` |
| Listing detail | `views/pages/ListingDetail/ListingDetailPage.tsx` | `modules/listings/listings.routes.ts`, reviews/rules services | `listings`, `listing_images`, `listing_rules`, `reviews` |
| Booking | `services/bookingService.ts`, `ListingDetailPage.tsx`, `MultiBookingPage.tsx`, `Trips/index.tsx` | `modules/bookings/bookings.routes.ts`, `bookings.controller.ts`, `bookings.service.ts`, `booking-pricing.service.ts` | `bookings`, `booking_date_locks`, `booking_status_history`, `availability_calendars` |
| Payment | `views/pages/GuestPayment/*`, `services/paymentService.ts` | `modules/payments/payments.routes.ts`, `payments.controller.ts`, `payments.service.ts` | `payments`, `payment_transactions`, `refunds`, `bookings` |
| Host listing | `views/pages/Host/ChoNghi`, `Host/ThemChoNghi`, `services/hostService.ts` | `modules/host-listings/host-listings.routes.ts`, `host-listings.service.ts` | `listings`, `listing_images`, `listing_amenities`, `listing_rules` |
| Host calendar | `views/pages/Host/LichLuuTru/index.tsx` | `host-listings.routes.ts`, `getListingCalendar`, `bulkUpdateListingCalendar` | `availability_calendars`, `bookings`, `booking_date_locks` |
| Upload/AI Vision | `Host/ThemChoNghi/index.tsx`, `services/uploadsApi.ts`, `services/api/listingImageAiService.ts` | `modules/uploads/uploads.routes.ts`, `modules/ai/listing-image-vision.routes.ts`, `listing-image-vision.service.ts` | `listing_images`, `image_analysis_results`, `image_tags`, `listings` |
| Wishlist | `views/pages/Wishlist/WishlistPage`, `features/useSavedListings`, `services/wishlistService.ts` | `modules/wishlist/wishlist.routes.ts`, `wishlist.service.ts` | `wishlists`, `listings` |
| Chat | `views/pages/Messages/MessagesPage.tsx`, `Host/TinNhan/index.tsx`, `HostMessagePage.tsx`, `services/api/conversationsApi.ts` | `modules/conversations/conversations.routes.ts`, `conversations.service.ts` | `conversation`, `conversation_participant`, `message` |
| Admin moderation | `views/pages/Admin/KiemDuyetBaiDang/index.jsx`, `services/adminService.ts` | `modules/admin/admin-listings.routes.ts`, admin service | `listings`, `audit_logs`, `notification_logs` |
| Host application | `views/pages/TroThanhHost/DangKyHost.jsx`, `views/pages/Admin/HoSoHost/index.jsx`, `services/api/hostApplicationService.ts` | `modules/host-applications/host-application.routes.ts`, `modules/admin/admin-host-application.routes.ts`, `host-application.service.ts` | `host_applications`, `host_identity_documents`, `users`, `roles`, `user_role` |
| Notification | `views/components/notifications/NotificationBell.tsx`, `services/notificationService.ts` | `modules/notifications/notifications.routes.ts`, `notification.service.ts` | `notification_logs` |
| Payout | `views/pages/Host/ThanhToan/index.tsx`, `services/payoutService.ts` | `modules/payouts/host-payouts.routes.ts`, `admin-host-payouts.routes.ts`, `payouts.service.ts` | `payout_account`, `host_payout_batch`, `host_payout_booking_item` |
| Reports/reviews | `Host/BaoCao`, `Host/DanhGia`, `services/hostService.ts`, `reviewService.ts` | `modules/reports/*`, `modules/reviews/*` | `reviews`, `review_replies`, `bookings`, `payments`, `audit_logs` |

## 27. Ghi chú review tài liệu

- Đã đối chiếu frontend routes: Có
- Đã đối chiếu backend API routes: Có
- Đã đối chiếu Sequelize models/migrations: Có
- Đã kiểm tra SQL demo: Có
- Các phần đã sửa lớn:
  1. Sửa AI Vision endpoints: `POST /api/host/listings/:listingId/images/analysis` → đúng là `GET` (lấy kết quả), route phân tích nhiều ảnh là `POST /api/ai/listings/:listingId/analyze-images`.
  2. Thêm auth routes `POST /api/auth/verify-email` và `POST /api/auth/verify-phone` bị thiếu.
  3. Sửa payload login: field `identifier` (không phải `emailOrUsername` trực tiếp; backend tự map).
  4. Sửa bảng `bookings` trong schema: bổ sung các cột `version`, `coupon_id`, `price_breakdown_json`, `booking_note`, `cancellation_reason`, `cancelled_by_user_id`, `checked_in_at`, `checked_out_at`; làm rõ không có `payment_status` trong bảng `bookings`.
  5. Sửa bảng `listings` trong schema: bổ sung đầy đủ các cột thực tế (`address_line`, `included_guests`, `bedrooms`, `beds`, `bathrooms`, `cleaning_fee`, `service_fee_pct`, `extra_guest_fee`, `min_nights`, `max_nights`, v.v.); xác nhận không có cột `location_group`.
  6. Sửa bảng `payments`: bổ sung `provider_response_code`, `provider_payload`, `refunded_at`.
  7. Sửa bảng `payout_account`: bổ sung `bank_short_name`, `bank_bin`, `branch_name`, `account_number_encrypted`.
  8. Bổ sung SQL field `raw_payload_json` cho `payment_transactions`.
  9. Làm rõ `booking_status_history` chỉ có `created_at`, không có `updated_at`.
  10. Bổ sung các route host listing: `PUT /api/host/listings/:listingId/amenities` và `PATCH /api/host/listings/:listingId/rules`.
  11. Sửa/tách chi tiết các route payout account (GET/POST/PATCH/DELETE riêng thay vì gộp).
  12. Sửa SQL demo booking mới nhất: bổ sung đầy đủ các cột booking thực tế.
- Các phần cần kiểm tra thêm trong DB thực tế:
  1. Bảng `roles` và `user_role`: source runtime có định nghĩa nhưng cần xác minh schema DB thực tế có đúng tên cột như trong model không.
  2. Backend build: Pass (npm run build thành công ngày 10/06/2026).
  3. Frontend build/lint: Cần chạy kiểm tra riêng nếu cần xác nhận, không thể chạy từ môi trường review này vì thiếu env.
