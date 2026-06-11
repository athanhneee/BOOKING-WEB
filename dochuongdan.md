Bạn là senior fullstack engineer, technical writer và reviewer cực kỳ kỹ tính cho dự án Minh Thành Villa.

Nhiệm vụ:
Đọc lại file `huongdan.md` hiện tại, sau đó đối chiếu với toàn bộ source code frontend + backend + models + migrations + routes + services + tests. Nếu file `huongdan.md` có nội dung sai, thiếu, bịa tên bảng/cột/route/API, hoặc viết chưa đủ chi tiết để demo, hãy chỉnh sửa lại trực tiếp file `huongdan.md`.

QUAN TRỌNG:

* CHỈ ĐƯỢC SỬA FILE `huongdan.md`.
* KHÔNG ĐƯỢC SỬA CODE FRONTEND.
* KHÔNG ĐƯỢC SỬA CODE BACKEND.
* KHÔNG ĐƯỢC SỬA MIGRATION.
* KHÔNG ĐƯỢC SỬA TEST.
* KHÔNG ĐƯỢC FORMAT LẠI FILE CODE.
* KHÔNG ĐƯỢC XÓA FILE.
* Không tạo file mới nếu không cần.
* Không được bịa tên bảng, tên cột, tên API, tên route, tên service.
* Nếu không xác minh được từ source, phải ghi rõ: “Cần kiểm tra lại trong DB thực tế” và nêu lý do.
* Không dùng các câu như “dựa vào code tôi thấy”, “tôi đọc code thấy”. Hãy viết theo văn phong tài liệu kỹ thuật chuyên nghiệp.

Mục tiêu của file `huongdan.md` sau khi review:

1. Đúng với source code hiện tại.
2. Đúng route frontend thật.
3. Đúng endpoint backend thật.
4. Đúng controller/service/model thật.
5. Đúng tên bảng/cột database thật theo Sequelize models và migrations.
6. SQL demo chạy được hoặc gần chạy được, không dùng field bịa.
7. Hướng dẫn demo rõ ràng từng bước.
8. Đặc biệt phần đặt phòng, thanh toán, booking status, payment status, booking date locks phải chính xác.

==================================================

1. ĐỌC FILE CẦN REVIEW
   ==================================================

Đọc kỹ file:

* `huongdan.md`

Ghi chú trong đầu:

* Section nào thiếu.
* Section nào sai.
* Section nào dùng tên bảng/cột/API không chắc chắn.
* Section nào viết chung chung.
* Section nào cần thêm SQL demo.
* Section nào cần sửa theo source thật.

==================================================
2. ĐỐI CHIẾU FRONTEND
=====================

Đọc kỹ frontend:

* `frontend/package.json`
* router chính:

  * `AppRoutes.tsx`
  * `ProtectedRoute.tsx`
  * `HostRoute.tsx`
  * các router/layout nếu có
* services API:

  * auth service
  * listing service
  * booking service
  * payment service
  * semantic search API
  * host service
  * wishlist service
  * chat service
  * notification service
  * admin service nếu có
* pages/components chính:

  * Auth pages
  * SearchPage
  * SearchBar
  * AiSearchPage
  * ListingDetailPage
  * Booking pages/history
  * Host pages: đăng villa, quản lý listing, lịch lưu trú, upload ảnh
  * Admin pages: duyệt listing, user, payout, verification nếu có
  * WishlistPage
  * Chat pages/components
  * NotificationBell

Yêu cầu đối chiếu:

1. URL frontend trong `huongdan.md` phải đúng router thật.
2. Component chính phải đúng tên file thật.
3. Quyền truy cập phải đúng role guard thật.
4. Frontend gọi API nào phải đúng service thật.
5. Không ghi màn hình không tồn tại.
6. Nếu một nghiệp vụ chưa có UI, ghi rõ: “Chưa có UI hoàn chỉnh trong source hiện tại” thay vì bịa.

==================================================
3. ĐỐI CHIẾU BACKEND API
========================

Đọc kỹ backend:

* `backend/package.json`
* `backend/src/app.ts`
* `backend/src/server.ts`
* tất cả route files:

  * auth
  * listings
  * semantic search
  * bookings
  * payments
  * host listings
  * uploads
  * wishlist
  * conversations/chat
  * notifications
  * admin
  * payouts/reports nếu có
* controllers
* services
* validators
* middlewares auth/role

Yêu cầu đối chiếu:

1. Endpoint trong `huongdan.md` phải đúng method + path thật.
2. Không ghi endpoint không tồn tại.
3. Controller/service xử lý phải đúng tên file/hàm chính.
4. Quyền API phải đúng middleware:

   * public
   * authenticated user
   * host
   * moderator
   * admin
5. Nếu endpoint có prefix `/api`, phải ghi nhất quán.
6. Nếu route nằm dưới `/api/host/...`, `/api/admin/...`, phải ghi đúng.
7. Nếu có endpoint return/webhook payment, phải ghi đúng route thật.

==================================================
4. ĐỐI CHIẾU DATABASE SCHEMA
============================

Đọc kỹ:

* Sequelize models
* migrations
* seeders nếu có
* enum/status definitions nếu có
* associations nếu có

Bắt buộc xác minh các bảng:

* users
* roles/user_roles nếu có
* listings
* listing_images
* amenities
* listing_amenities
* bookings
* payments
* booking_date_locks hoặc bảng tương ứng
* availability calendar / host calendar table tương ứng
* wishlists hoặc wishlist table tương ứng
* conversations
* messages
* notification_logs
* refunds
* payouts
* image_analysis_results
* image_tags
* upload metadata nếu có

Yêu cầu:

1. Tên bảng trong SQL phải đúng.
2. Tên cột trong SQL phải đúng.
3. Không dùng field `role`, `host_id`, `location_group`, `payment_status` nếu source không có đúng tên đó.
4. Nếu Sequelize dùng camelCase nhưng DB dùng snake_case, SQL phải dùng snake_case.
5. Nếu field có tên khác, sửa lại theo schema thật.
6. Nếu bảng không tồn tại, xóa khỏi SQL hoặc ghi rõ chưa có bảng này trong source hiện tại.
7. Nếu một quan hệ dùng bảng trung gian, ghi đúng bảng trung gian.
8. Nếu có soft delete `deleted_at`, ghi đúng.

==================================================
5. REVIEW CỰC KỲ KỸ PHẦN BOOKING
================================

Phần booking là quan trọng nhất. Phải đối chiếu kỹ:

* Frontend booking form/component.
* API tạo booking.
* Backend booking controller/service.
* Validator date/guest.
* Availability check.
* Booking lock service.
* Payment creation nếu có.
* Booking status enum.
* Payment status enum.
* Date lock table.
* Expire pending payment logic.
* Cancel booking logic.

Trong `huongdan.md`, phần đặt phòng phải có:

1. Luồng người dùng:

   * mở listing detail
   * chọn check-in/check-out
   * chọn số khách
   * bấm đặt phòng
   * chuyển sang chờ thanh toán/thanh toán

2. API:

   * method/path thật
   * payload thật
   * response thật

3. Backend:

   * route/controller/service thật
   * hàm kiểm tra availability thật
   * bảng ghi thật

4. Database:

   * bảng bookings
   * bảng payment nếu có
   * bảng date locks nếu có
   * bảng notification nếu có

5. SQL demo đúng:

   * xem booking mới
   * xem booking theo listing
   * xem date locks
   * xem payment theo booking
   * xem status booking

6. Demo trước/sau:

   * trước khi đặt chưa có booking
   * sau khi đặt có booking
   * sau khi đặt có lock ngày
   * search lại cùng ngày không thấy villa hoặc không đặt được

7. Lỗi cần demo:

   * ngày quá khứ
   * checkout <= checkin
   * vượt quá khách
   * ngày đã có booking
   * ngày bị host block
   * payment expired

Nếu `huongdan.md` hiện viết chung chung, phải bổ sung chi tiết.

==================================================
6. REVIEW CỰC KỲ KỸ PHẦN PAYMENT
================================

Đối chiếu:

* VNPay routes.
* MoMo routes.
* payment service.
* return URL.
* webhook/IPN.
* refund logic nếu có.
* booking status sau payment.
* payment status enum.

Trong `huongdan.md` phải đúng:

1. Tạo payment từ booking nào.
2. API tạo payment URL.
3. Return URL chỉ là kết quả frontend hay backend xác minh.
4. Webhook/IPN cập nhật payment/booking thế nào.
5. Duplicate callback xử lý ra sao nếu source có.
6. SQL demo:

   * payments
   * bookings
   * refunds nếu có

Không được ghi “thanh toán thành công thì booking confirmed” nếu source thật chỉ chuyển `paid`. Phải ghi đúng.

==================================================
7. REVIEW PHẦN BOOKING STATUS MAPPING
=====================================

Trong phụ lục trạng thái booking, đối chiếu enum/status thật.

Cần map chính xác:

* Chờ thanh toán
* Quá hạn thanh toán
* Thanh toán thành công
* Đã xác nhận
* Đã nhận phòng
* Đã trả phòng
* Hoàn tất
* Đã hủy

Yêu cầu:

1. UI label phải map đúng booking.status thật.
2. payment status phải map đúng nếu có.
3. Không tự suy diễn status không tồn tại.
4. Nếu frontend có computed display status, ghi rõ.
5. Nếu backend có enum khác, dùng enum thật.
6. Nếu trạng thái nào UI có nhưng DB chưa có, ghi rõ cách hệ thống đang xử lý.

==================================================
8. REVIEW PHẦN HOST LISTING / CALENDAR / IMAGE / AI VISION
==========================================================

Đối chiếu:

* Host tạo listing endpoint.
* Listing status sau khi tạo.
* Admin/moderator approve/reject.
* Upload image flow.
* R2 presign/upload/register.
* AI Vision analyze endpoint.
* image_analysis_results/image_tags schema.
* Host calendar get/update endpoint.
* Availability table.

Sửa `huongdan.md` để đúng:

1. Host đăng villa ghi bảng nào.
2. Ảnh lưu bảng nào.
3. Cover image field nào.
4. AI Vision status field nào.
5. Calendar update ghi bảng nào.
6. SQL demo đúng cột.

Nếu chưa có phần nào trong source, ghi rõ chưa có hoặc chưa hoàn chỉnh.

==================================================
9. REVIEW PHẦN SEARCH / SEMANTIC SEARCH
=======================================

Đối chiếu:

* SearchBar params.
* SearchPage API.
* listings service filters.
* semantic search parser/service.
* qdrant/embedding service nếu có.
* fallback keyword.
* location rules Vũng Tàu.
* date validation.
* map lat/lng/radius.

Sửa `huongdan.md` để:

1. Query params đúng.
2. API endpoint đúng.
3. Bảng search đọc đúng.
4. SQL demo đúng.
5. Query demo đúng:

   * villa vũng tàu
   * villa bãi sau
   * villa trung tâm
   * hello
   * nha trang/đà lạt

==================================================
10. REVIEW PHẦN WISHLIST / CHAT / NOTIFICATION / PAYOUT
=======================================================

Đối chiếu từng phần:

Wishlist:

* endpoint add/remove/list
* table thật
* user/listing relation

Chat:

* conversation endpoint
* message endpoint
* socket event nếu có
* conversations/messages schema

Notification:

* notification_logs schema
* API list/read
* booking/payment notification triggers

Payout:

* payout table
* host payout account
* approve/paid flow
* 2-admin rule nếu có

Nếu `huongdan.md` bịa nghiệp vụ chưa có, sửa lại.

==================================================
11. KIỂM TRA SQL TRONG FILE
===========================

Tìm tất cả code block SQL trong `huongdan.md`.

Với mỗi query:

1. Kiểm tra tên bảng có tồn tại.
2. Kiểm tra tên cột có tồn tại.
3. Kiểm tra enum/status đúng.
4. Kiểm tra ORDER BY field có tồn tại.
5. Nếu có placeholder `<BOOKING_ID>`, `<LISTING_ID>`, giữ nguyên được.
6. Nếu SQL cần JOIN để đúng schema, sửa thành JOIN.
7. Nếu không thể xác minh, thêm note.

Ví dụ:
Nếu users không có cột `role` mà có bảng `user_roles`, sửa SQL thành JOIN đúng.

Nếu bookings không có `payment_status`, không được select `payment_status`.

Nếu listing table dùng `locationGroup` ở model nhưng DB column là `location_group`, SQL phải dùng `location_group`.

==================================================
12. CẬP NHẬT FILE `huongdan.md`
===============================

Sau khi đối chiếu, sửa trực tiếp file `huongdan.md`:

1. Sửa các route sai.
2. Sửa API sai.
3. Sửa bảng/cột sai.
4. Sửa SQL sai.
5. Bổ sung phần thiếu.
6. Xóa phần bịa/chưa có.
7. Thêm note cho phần chưa chắc chắn.
8. Chuẩn hóa tiếng Việt.
9. Giữ cấu trúc rõ ràng, dễ demo.
10. Không viết quá lan man, nhưng phải đủ chi tiết.

==================================================
13. CHẠY KIỂM TRA NẾU CÓ THỂ
============================

Chạy:

```bash
cd backend
npm run build
npm run typecheck
npm test
```

```bash
cd frontend
npm run lint
npm run build
```

Nếu không chạy được vì thiếu env/DB, ghi note trong `huongdan.md` hoặc báo cáo cuối.

Không được sửa code để làm test pass.

==================================================
14. TẠO BÁO CÁO REVIEW NGẮN Ở CUỐI FILE
=======================================

Cuối `huongdan.md`, thêm section:

```md
## 27. Ghi chú review tài liệu

- Đã đối chiếu frontend routes: Có/Không
- Đã đối chiếu backend API routes: Có/Không
- Đã đối chiếu Sequelize models/migrations: Có/Không
- Đã kiểm tra SQL demo: Có/Không
- Các phần đã sửa lớn:
  1. ...
  2. ...
- Các phần cần kiểm tra thêm trong DB thực tế:
  1. ...
```

==================================================
15. PHẢN HỒI SAU KHI HOÀN THÀNH
===============================

Sau khi sửa xong, chỉ trả lời ngắn gọn:

* Đã review và cập nhật `huongdan.md`.
* Chỉ sửa file `huongdan.md`.
* Đã đối chiếu route/API/model/migration.
* Đã chạy lệnh nào và kết quả.
* Các phần còn cần kiểm tra DB thực tế nếu có.


