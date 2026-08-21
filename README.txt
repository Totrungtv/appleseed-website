APPLE SEED — BỘ CODE FINAL

NGUYÊN TẮC:
- Lấy đúng Admin và Index gốc của ông làm nền.
- Không viết lại SEO.
- Không viết lại AI.
- Không đổi giao diện Admin.
- Không tạo thêm Google Maps.
- Chỉ sửa Gallery và chống render trùng map/contact.

FILES:
1. admin.html
   Admin gốc + Gallery hoàn chỉnh:
   - chọn nhiều ảnh
   - preview ngay
   - nhận diện HEIC thật kể cả file bị đổi đuôi .JPG
   - HEIC -> JPG trước khi upload
   - lưu vào Storage site-images/products-gallery
   - lưu product_images
   - đặt ảnh chính
   - xóa DB rồi kiểm tra, sau đó xóa Storage

2. index.html
   Index gốc, giữ nguyên SEO keywords/title/description/canonical/OG và AI.
   Chỉ chống trường hợp CMS có nhiều section map/contact khiến hiện 2 bản đồ.

3. supabase-config.js
   Giữ nguyên cấu hình Supabase hiện tại.

4. APPLE_SEED_PRODUCT_GALLERY.sql
   Query riêng đã chạy thành công. Không cần upload lên GitHub.

GITHUB:
- thay index.html
- thay admin.html
- giữ các file hiện có như style.css, favicon.png, shop.jpg và các asset khác
- không xóa SQL cũ
