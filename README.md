# Xraptor - Full-Stack Website Pickleball (Clean Architecture + Thanh toán + Phân quyền RBAC)

Website thương mại điện tử vợt & phụ kiện Pickleball **Xraptor** gồm **Frontend Storefront (React + Vite + Tailwind CSS v4)**, **Backend REST API theo Clean Architecture (Node.js + Express 5 + SQLite/Supabase)**, **Hệ thống Thanh toán (COD / VietQR / VNPay + Sandbox)** và **Trang Quản trị Admin phân quyền RBAC (`/admin`)**.

## Kiến trúc Clean Architecture (Backend `server/`)

```text
server/
├── domain/                 # Tầng 1: Entities, AppError, RBAC Permission Matrix (không phụ thuộc framework/DB)
├── application/use-cases/  # Tầng 2: Use Cases nghiệp vụ (nhận Repository & Gateway qua Dependency Injection)
├── infrastructure/         # Tầng 3: SQLite & Supabase Repositories, Scrypt/HMAC Security, Storage, VietQR & VNPay Gateways
├── interfaces/http/        # Tầng 4: Express Controllers, Routes, Middlewares (authenticate & requirePermission), Error Handler
├── container.js            # Composition Root (lắp ráp DI Container)
├── app.js                  # Export Express app (dùng chung cho local & Vercel api/index.js)
└── index.js                # Standalone HTTP server
```

## Phân quyền RBAC (4 vai trò Admin Portal)

| Vai trò | Tài khoản mặc định | Quyền chính |
|---|---|---|
| `superadmin` | `admin@xraptor.vn` / `admin123` | Toàn quyền hệ thống, quản lý nhân sự & phân quyền, xóa đơn hàng, hoàn tiền |
| `manager` | `manager@xraptor.vn` / `manager123` | Quản lý sản phẩm, đơn hàng, xác nhận & hoàn tiền thanh toán, liên hệ, blog, subscribers |
| `staff` | `staff@xraptor.vn` / `staff123` | Xem tổng quan/sản phẩm, xử lý đơn hàng, xác nhận thanh toán COD/VietQR, xử lý liên hệ |
| `editor` | `editor@xraptor.vn` / `editor123` | Xem tổng quan/sản phẩm, toàn quyền quản lý Blog - Tin tức, upload ảnh, xem subscribers |

> Quyền hạn được kiểm tra **2 lớp**: tầng HTTP Middleware (`requirePermission`) và tầng Application Use Case (`assertPermission`), đồng thời đọc trạng thái tài khoản trực tiếp từ DB nên việc khóa tài khoản hoặc đổi vai trò có hiệu lực ngay lập tức.

## Hệ thống Thanh toán (Payment)
1. **COD**: Thanh toán khi nhận hàng; tự động đánh dấu `Đã thanh toán` khi đơn chuyển sang `Hoàn thành` hoặc được xác nhận thu tiền.
2. **Chuyển khoản VietQR**: Tự động sinh mã QR ngân hàng kèm số tiền & nội dung chuyển khoản `XRAPTOR <Mã đơn>`.
3. **Cổng thanh toán VNPay**:
   - Khi điền `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` trong `.env`: tạo URL thanh toán VNPay v2.1.0 ký **HMAC-SHA512**, kèm Return URL (`/api/payments/vnpay/return`) và IPN webhook (`/api/payments/vnpay/ipn`).
   - Khi chưa điền key VNPay: tự động dùng **VNPay Sandbox Simulator** ký **HMAC-SHA256** ngay trong giỏ hàng để kiểm thử đầy đủ luồng thanh toán thành công / thất bại / thử lại / hoàn tiền.

## Cài đặt, Chạy & Kiểm thử

```bash
# Cài đặt thư viện
npm install

# Chạy song song Backend API (port 4000) và Frontend Vite (port 5173)
npm run dev

# Chạy bộ kiểm thử tự động Clean Architecture, RBAC & Payment
npm test

# Đóng gói production
npm run build
```

## Kết nối Supabase (PostgreSQL + Storage)
1. Tạo project miễn phí tại [supabase.com](https://supabase.com).
2. Vào **SQL Editor** → dán toàn bộ nội dung file `supabase/schema.sql` → bấm **Run**.
3. Copy `.env.example` thành `.env` và điền `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Bỏ trống để chạy Local SQLite (`server/data/xraptor.db`).
