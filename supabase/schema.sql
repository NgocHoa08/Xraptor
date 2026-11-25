-- ============================================================
-- XRAPTOR PICKLEBALL - SUPABASE POSTGRESQL SCHEMA
-- Dán toàn bộ nội dung file này vào Supabase -> SQL Editor -> Run
-- ============================================================

-- 1. Quản trị viên (Admins)
CREATE TABLE IF NOT EXISTS public.admins (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'superadmin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sản phẩm (Products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  old_price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (featured);

-- 3. Đơn hàng (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'COD',
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Chờ xác nhận',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders (order_code);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders (phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- 4. Chi tiết đơn hàng (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- 5. Liên hệ khách hàng (Contacts)
CREATE TABLE IF NOT EXISTS public.contacts (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  order_code TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Chưa xử lý',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Email đăng ký nhận bản tin (Subscribers)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Blog - Tin tức (Blogs)
CREATE TABLE IF NOT EXISTS public.blogs (
  id TEXT PRIMARY KEY,
  tag TEXT NOT NULL DEFAULT 'Tin tức',
  published_date TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Bật Row Level Security (RLS) & cấp quyền cho service_role (bắt buộc với sb_secret key mới)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 9. Bucket lưu trữ ảnh upload từ Admin (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('xraptor-uploads', 'xraptor-uploads', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read xraptor-uploads" ON storage.objects;
CREATE POLICY "Public read xraptor-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'xraptor-uploads');
