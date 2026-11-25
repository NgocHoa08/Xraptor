# Xraptor - Full-Stack Website Pickleball (Storefront + Backend API + Admin Portal)

Website thương mại điện tử vợt & phụ kiện Pickleball **Xraptor** gồm đầy đủ **Frontend Storefront**, **Backend REST API (Express + SQLite)** và **Trang Quản trị Admin (`/admin`)**.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js (Express 5 + SQLite `node:sqlite`, Multer upload ảnh, HMAC token auth)
- **Triển khai**: Hỗ trợ chạy local (`npm run dev`) và deploy trực tiếp lên **Vercel** (`api/index.js` + `vercel.json`)

## Tính năng chính
### 1. Cửa hàng (Storefront)
- **Trang chủ**: Hero slider, Vì sao chọn chúng tôi, Danh mục sản phẩm, Sản phẩm nổi bật, Về Xraptor, Phụ kiện Pickleball, Phản hồi khách hàng & Video review, Blog - Tin tức (tải động từ API).
- **Phụ kiện & Danh mục**: Lọc theo dòng vợt/phụ kiện, tìm kiếm, sắp xếp giá/tên, phân trang.
- **Chi tiết sản phẩm**: Gallery 6 ảnh, thông số kỹ thuật, tồn kho thực tế, thêm vào giỏ / mua ngay.
- **Giỏ hàng & Đặt hàng**: Quy trình đặt hàng 2 bước (COD / Chuyển khoản), tự động trừ tồn kho và cấp mã đơn (`XR-XXXXXX`).
- **Tra cứu đơn hàng**: Kiểm tra trạng thái đơn theo mã đơn hoặc số điện thoại.
- **Liên hệ & Bản tin**: Gửi form liên hệ và đăng ký email trực tiếp về Backend.

### 2. Trang Quản trị (`/admin`)
- Truy cập: **`http://localhost:5173/admin`** (hoặc bấm **Trang quản trị (Admin)** ở góc dưới Footer)
- Tài khoản mặc định:
  - **Email**: `admin@xraptor.vn`
  - **Mật khẩu**: `admin123`
- Chức năng: Tổng quan KPI & biểu đồ kho hàng, CRUD Sản phẩm (kèm upload ảnh), Quản lý Đơn hàng & đổi trạng thái, Quản lý Liên hệ, Quản lý Blog, Xuất CSV danh sách email đăng ký, Đổi mật khẩu quản trị.

## Kết nối Supabase (PostgreSQL + Storage)
1. Tạo project miễn phí tại [supabase.com](https://supabase.com).
2. Vào **SQL Editor** → dán toàn bộ nội dung file `supabase/schema.sql` → bấm **Run**.
3. Vào **Project Settings → API**, lấy `Project URL` và `service_role` secret key, rồi điền vào:
   - **Local**: copy `.env.example` thành `.env` và điền `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - **Vercel**: vào **Project Settings → Environment Variables** và thêm `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_JWT_SECRET`.
4. Dữ liệu mẫu (28 sản phẩm, 3 blog, đơn hàng mẫu, tài khoản Admin) sẽ tự động được khởi tạo ở lần kết nối đầu tiên.

## Cài đặt & Chạy dự án

```bash
# Cài đặt thư viện
npm install

# Chạy song song cả Backend API (port 4000) và Frontend Vite (port 5173)
npm run dev

# Đóng gói production
npm run build
```
