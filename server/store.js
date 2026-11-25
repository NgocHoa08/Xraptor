import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from './auth.js';
import {
  SEED_PRODUCTS,
  SEED_BLOGS,
  SEED_ORDERS,
  SEED_CONTACTS,
  SEED_SUBSCRIBERS,
} from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'xraptor-uploads';
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);

function normalizeProduct(row) {
  if (!row) return null;
  let gallery = [];
  if (Array.isArray(row.gallery)) {
    gallery = row.gallery;
  } else if (typeof row.gallery === 'string') {
    try {
      gallery = JSON.parse(row.gallery || '[]');
    } catch {
      gallery = [row.image];
    }
  }
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: Number(row.price),
    oldPrice: Number(row.old_price || 0),
    stock: Number(row.stock || 0),
    category: row.category,
    subCategory: row.sub_category || '',
    featured: Boolean(row.featured),
    image: row.image,
    gallery: gallery.length ? gallery : [row.image],
    specs: row.specs || '',
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeBlog(b) {
  if (!b) return null;
  return {
    id: b.id,
    tag: b.tag,
    date: b.published_date,
    title: b.title,
    excerpt: b.excerpt || '',
    content: b.content || '',
    image: b.image,
    createdAt: b.created_at,
  };
}

// ============================================================
// SUPABASE IMPLEMENTATION
// ============================================================
function createSupabaseStore() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let seededPromise = null;

  async function ensureSeeded() {
    if (seededPromise) return seededPromise;
    seededPromise = (async () => {
      // Seed default admin if admins table is empty
      const { count: adminCount, error: adminErr } = await supabase
        .from('admins')
        .select('id', { count: 'exact', head: true });
      if (adminErr) {
        seededPromise = null;
        throw new Error(
          `Chưa tạo bảng trên Supabase (${adminErr.message}). Hãy chạy file supabase/schema.sql trong Supabase SQL Editor.`
        );
      }

      if (!adminCount) {
        await supabase.from('admins').insert({
          email: 'admin@xraptor.vn',
          name: 'Quản trị viên Xraptor',
          password_hash: hashPassword('admin123'),
          role: 'superadmin',
        });
      }

      const { count: prodCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      if (!prodCount) {
        await supabase.from('products').insert(
          SEED_PRODUCTS.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            old_price: p.old_price || 0,
            stock: p.stock || 0,
            category: p.category,
            sub_category: p.sub_category || '',
            featured: Boolean(p.featured),
            image: p.image,
            gallery: p.gallery || [p.image],
            specs: p.specs || '',
            description: p.description || '',
          }))
        );
      }

      const { count: blogCount } = await supabase
        .from('blogs')
        .select('id', { count: 'exact', head: true });
      if (!blogCount) {
        await supabase.from('blogs').insert(SEED_BLOGS);
      }

      const { count: orderCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });
      if (!orderCount) {
        for (const o of SEED_ORDERS) {
          const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
          const { data: ord } = await supabase
            .from('orders')
            .insert({
              order_code: o.order_code,
              customer_name: o.customer_name,
              phone: o.phone,
              email: o.email,
              address: o.address,
              note: o.note,
              payment_method: o.payment_method,
              total_amount: total,
              status: o.status,
            })
            .select()
            .single();
          if (ord) {
            await supabase.from('order_items').insert(
              o.items.map((item) => ({
                order_id: ord.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_image: item.product_image,
                price: item.price,
                qty: item.qty,
              }))
            );
          }
        }
      }

      const { count: contactCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });
      if (!contactCount) {
        await supabase.from('contacts').insert(SEED_CONTACTS);
      }

      const { count: subCount } = await supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true });
      if (!subCount) {
        await supabase
          .from('subscribers')
          .upsert(
            SEED_SUBSCRIBERS.map((email) => ({ email })),
            { onConflict: 'email' }
          );
      }
    })();
    return seededPromise;
  }

  return {
    mode: 'supabase',
    ensureSeeded,

    async getAdminByEmail(email) {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async getAdminById(id) {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async updateAdminPassword(id, passwordHash) {
      const { error } = await supabase
        .from('admins')
        .update({ password_hash: passwordHash })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },

    async uploadImage(file) {
      const ext = path.extname(file.originalname || '.webp').toLowerCase() || '.webp';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype || 'image/webp',
          upsert: false,
        });
      if (error) {
        // Fallback to data URL if storage bucket wasn't created
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
      return data.publicUrl;
    },

    async getDashboard() {
      await ensureSeeded();
      const [ordersRes, productsRes, contactsRes, subsRes] = await Promise.all([
        supabase.from('orders').select('*').order('id', { ascending: false }),
        supabase.from('products').select('id, sku, name, category, stock, price, image'),
        supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Chưa xử lý'),
        supabase.from('subscribers').select('id', { count: 'exact', head: true }),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      const totalRevenue = orders
        .filter((o) => o.status !== 'Đã hủy')
        .reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === 'Chờ xác nhận').length;
      const completedOrders = orders.filter((o) => o.status === 'Hoàn thành').length;

      const catMap = new Map();
      for (const p of products) {
        const entry = catMap.get(p.category) || {
          category: p.category,
          productCount: 0,
          totalStock: 0,
        };
        entry.productCount += 1;
        entry.totalStock += Number(p.stock || 0);
        catMap.set(p.category, entry);
      }

      const lowStockProducts = [...products]
        .filter((p) => Number(p.stock) <= 15)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6);

      return {
        database: 'supabase',
        kpis: {
          totalRevenue,
          totalOrders: orders.length,
          pendingOrders,
          completedOrders,
          totalProducts: products.length,
          lowStockCount: products.filter((p) => Number(p.stock) <= 10).length,
          unreadContacts: contactsRes.count || 0,
          totalSubscribers: subsRes.count || 0,
        },
        byCategory: [...catMap.values()],
        recentOrders: orders.slice(0, 6),
        lowStockProducts,
      };
    },

    async listProducts({ category, subCategory, featured, search, sort } = {}) {
      await ensureSeeded();
      let q = supabase.from('products').select('*');
      if (category) q = q.eq('category', String(category));
      if (subCategory) q = q.eq('sub_category', String(subCategory));
      if (featured === '1' || featured === 'true') q = q.eq('featured', true);

      if (sort === 'price-asc') q = q.order('price', { ascending: true });
      else if (sort === 'price-desc') q = q.order('price', { ascending: false });
      else if (sort === 'name-asc') q = q.order('name', { ascending: true });
      else q = q.order('created_at', { ascending: true });

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      let list = (data || []).map(normalizeProduct);
      if (search) {
        const term = String(search).toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
        );
      }
      return list;
    },

    async getProductById(id) {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return normalizeProduct(data);
    },

    async createProduct(body) {
      await ensureSeeded();
      const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const gal = Array.isArray(body.gallery) && body.gallery.length ? body.gallery : [body.image];
      const { data, error } = await supabase
        .from('products')
        .insert({
          id,
          sku: String(body.sku).trim(),
          name: String(body.name).trim(),
          price: Math.round(Number(body.price)),
          old_price: Math.round(Number(body.oldPrice) || 0),
          stock: Math.max(0, Math.round(Number(body.stock) || 0)),
          category: String(body.category).trim(),
          sub_category: String(body.subCategory || '').trim(),
          featured: Boolean(body.featured),
          image: String(body.image).trim(),
          gallery: gal,
          specs: String(body.specs || ''),
          description: String(body.description || ''),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalizeProduct(data);
    },

    async updateProduct(id, body) {
      const existing = await this.getProductById(id);
      if (!existing) return null;
      const nextImage = body.image ?? existing.image;
      const nextGallery = Array.isArray(body.gallery)
        ? body.gallery.length
          ? body.gallery
          : [nextImage]
        : existing.gallery;

      const { data, error } = await supabase
        .from('products')
        .update({
          sku: body.sku ?? existing.sku,
          name: body.name ?? existing.name,
          price: body.price !== undefined ? Math.round(Number(body.price)) : existing.price,
          old_price:
            body.oldPrice !== undefined ? Math.round(Number(body.oldPrice) || 0) : existing.oldPrice,
          stock:
            body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock) || 0)) : existing.stock,
          category: body.category ?? existing.category,
          sub_category: body.subCategory ?? existing.subCategory,
          featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
          image: nextImage,
          gallery: nextGallery,
          specs: body.specs ?? existing.specs,
          description: body.description ?? existing.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalizeProduct(data);
    },

    async deleteProduct(id) {
      const { error, count } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    },

    async createOrder({ customerName, phone, email, address, note, paymentMethod, items }) {
      await ensureSeeded();
      let totalAmount = 0;
      const verifiedItems = [];

      for (const item of items) {
        const qty = Math.max(1, Math.round(Number(item.qty) || 1));
        const dbProd = await this.getProductById(item.productId);
        const price = dbProd ? dbProd.price : Math.round(Number(item.price) || 0);
        const name = dbProd ? dbProd.name : String(item.name || 'Sản phẩm Xraptor');
        const image = dbProd ? dbProd.image : String(item.image || '');
        totalAmount += price * qty;
        verifiedItems.push({
          product_id: dbProd ? dbProd.id : String(item.productId || 'custom'),
          product_name: name,
          product_image: image,
          price,
          qty,
          dbProd,
        });
      }

      const orderCode = `XR-${Date.now().toString().slice(-6)}`;
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_name: String(customerName).trim(),
          phone: String(phone).trim(),
          email: String(email || '').trim(),
          address: String(address).trim(),
          note: String(note || '').trim(),
          payment_method: String(paymentMethod || 'COD'),
          total_amount: totalAmount,
          status: 'Chờ xác nhận',
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      const { data: createdItems, error: itemErr } = await supabase
        .from('order_items')
        .insert(
          verifiedItems.map((vi) => ({
            order_id: order.id,
            product_id: vi.product_id,
            product_name: vi.product_name,
            product_image: vi.product_image,
            price: vi.price,
            qty: vi.qty,
          }))
        )
        .select();
      if (itemErr) throw new Error(itemErr.message);

      // Deduct stock
      for (const vi of verifiedItems) {
        if (vi.dbProd) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, vi.dbProd.stock - vi.qty) })
            .eq('id', vi.dbProd.id);
        }
      }

      return { ...order, items: createdItems || [] };
    },

    async trackOrders(query) {
      await ensureSeeded();
      const qClean = String(query || '').trim();
      const qNoSpace = qClean.replace(/\s+/g, '');
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('id', { ascending: false });
      if (error) throw new Error(error.message);

      return (data || [])
        .filter(
          (o) =>
            o.order_code.toUpperCase() === qClean.toUpperCase() ||
            o.phone.replace(/\s+/g, '') === qNoSpace
        )
        .map(({ order_items, ...o }) => ({ ...o, items: order_items || [] }));
    },

    async listOrders({ status, search } = {}) {
      await ensureSeeded();
      let q = supabase.from('orders').select('*, order_items(*)').order('id', { ascending: false });
      if (status && status !== 'Tất cả') q = q.eq('status', String(status));
      const { data, error } = await q;
      if (error) throw new Error(error.message);

      let list = (data || []).map(({ order_items, ...o }) => ({
        ...o,
        items: order_items || [],
      }));
      if (search) {
        const term = String(search).toLowerCase();
        list = list.filter(
          (o) =>
            o.order_code.toLowerCase().includes(term) ||
            o.customer_name.toLowerCase().includes(term) ||
            o.phone.includes(term)
        );
      }
      return list;
    },

    async updateOrderStatus(id, status) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select('*, order_items(*)')
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const { order_items, ...o } = data;
      return { ...o, items: order_items || [] };
    },

    async deleteOrder(id) {
      const { error, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    },

    async createContact({ fullName, phone, email, orderCode, subject, message }) {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          full_name: String(fullName).trim(),
          phone: String(phone).trim(),
          email: String(email || '').trim(),
          order_code: String(orderCode || '').trim(),
          subject: String(subject).trim(),
          message: String(message).trim(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },

    async listContacts() {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },

    async updateContactStatus(id, status) {
      const { data, error } = await supabase
        .from('contacts')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async deleteContact(id) {
      const { error, count } = await supabase
        .from('contacts')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    },

    async createSubscriber(email) {
      await ensureSeeded();
      const { error } = await supabase
        .from('subscribers')
        .upsert({ email }, { onConflict: 'email' });
      if (error) throw new Error(error.message);
      return { ok: true, email };
    },

    async listSubscribers() {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },

    async deleteSubscriber(id) {
      const { error } = await supabase.from('subscribers').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    },

    async listBlogs() {
      await ensureSeeded();
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(normalizeBlog);
    },

    async createBlog({ tag, date, title, excerpt, content, image }) {
      await ensureSeeded();
      const id = `blog-${Date.now().toString(36)}`;
      const pubDate =
        date ||
        new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
      const { data, error } = await supabase
        .from('blogs')
        .insert({
          id,
          tag: tag || 'Tin tức',
          published_date: pubDate,
          title: title.trim(),
          excerpt: (excerpt || '').trim(),
          content: (content || '').trim(),
          image: image.trim(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalizeBlog(data);
    },

    async updateBlog(id, body) {
      const { data: existing } = await supabase.from('blogs').select('*').eq('id', id).maybeSingle();
      if (!existing) return null;
      const { data, error } = await supabase
        .from('blogs')
        .update({
          tag: body.tag ?? existing.tag,
          published_date: body.date ?? existing.published_date,
          title: body.title ?? existing.title,
          excerpt: body.excerpt ?? existing.excerpt,
          content: body.content ?? existing.content,
          image: body.image ?? existing.image,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalizeBlog(data);
    },

    async deleteBlog(id) {
      const { error, count } = await supabase
        .from('blogs')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    },
  };
}

// ============================================================
// LOCAL SQLITE FALLBACK IMPLEMENTATION
// ============================================================
async function createSqliteStore() {
  const { default: db } = await import('./db.js');
  const isVercel = Boolean(process.env.VERCEL);
  const uploadsDir = isVercel
    ? '/tmp/xraptor-uploads'
    : path.resolve(__dirname, '../public/uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  return {
    mode: 'sqlite',
    async ensureSeeded() {},

    async getAdminByEmail(email) {
      return db.prepare('SELECT * FROM admins WHERE email = ?').get(email) || null;
    },
    async getAdminById(id) {
      return db.prepare('SELECT * FROM admins WHERE id = ?').get(id) || null;
    },
    async updateAdminPassword(id, passwordHash) {
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(passwordHash, id);
    },

    async uploadImage(file) {
      if (isVercel) {
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
      const ext = path.extname(file.originalname || '.webp').toLowerCase() || '.webp';
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, safe), file.buffer);
      return `/uploads/${safe}`;
    },

    async getDashboard() {
      const orderStats = db
        .prepare(
          `SELECT
            COUNT(*) AS totalOrders,
            SUM(CASE WHEN status != 'Đã hủy' THEN total_amount ELSE 0 END) AS totalRevenue,
            SUM(CASE WHEN status = 'Chờ xác nhận' THEN 1 ELSE 0 END) AS pendingOrders,
            SUM(CASE WHEN status = 'Hoàn thành' THEN 1 ELSE 0 END) AS completedOrders
          FROM orders`
        )
        .get();
      const productStats = db
        .prepare(
          `SELECT COUNT(*) AS totalProducts, SUM(CASE WHEN stock <= 10 THEN 1 ELSE 0 END) AS lowStockCount FROM products`
        )
        .get();
      const unreadContacts = db
        .prepare("SELECT COUNT(*) AS cnt FROM contacts WHERE status = 'Chưa xử lý'")
        .get().cnt;
      const totalSubscribers = db.prepare('SELECT COUNT(*) AS cnt FROM subscribers').get().cnt;
      const byCategory = db
        .prepare(
          'SELECT category, COUNT(id) AS productCount, COALESCE(SUM(stock), 0) AS totalStock FROM products GROUP BY category'
        )
        .all();
      const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 6').all();
      const lowStockProducts = db
        .prepare('SELECT id, sku, name, category, stock, price, image FROM products WHERE stock <= 15 ORDER BY stock ASC LIMIT 6')
        .all();

      return {
        database: 'sqlite',
        kpis: {
          totalRevenue: orderStats.totalRevenue || 0,
          totalOrders: orderStats.totalOrders || 0,
          pendingOrders: orderStats.pendingOrders || 0,
          completedOrders: orderStats.completedOrders || 0,
          totalProducts: productStats.totalProducts || 0,
          lowStockCount: productStats.lowStockCount || 0,
          unreadContacts,
          totalSubscribers,
        },
        byCategory,
        recentOrders,
        lowStockProducts,
      };
    },

    async listProducts({ category, subCategory, featured, search, sort } = {}) {
      const where = [];
      const params = [];
      if (category) {
        where.push('category = ?');
        params.push(String(category));
      }
      if (subCategory) {
        where.push('sub_category = ?');
        params.push(String(subCategory));
      }
      if (featured === '1' || featured === 'true') where.push('featured = 1');
      if (search) {
        where.push('(LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category) LIKE ?)');
        const q = `%${String(search).toLowerCase()}%`;
        params.push(q, q, q);
      }
      let orderSql = 'ORDER BY rowid ASC';
      if (sort === 'price-asc') orderSql = 'ORDER BY price ASC';
      else if (sort === 'price-desc') orderSql = 'ORDER BY price DESC';
      else if (sort === 'name-asc') orderSql = 'ORDER BY name ASC';
      else if (sort === 'newest') orderSql = 'ORDER BY created_at DESC, rowid DESC';

      const rows = db
        .prepare(`SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${orderSql}`)
        .all(...params);
      return rows.map(normalizeProduct);
    },

    async getProductById(id) {
      return normalizeProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
    },

    async createProduct(body) {
      const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const gal = Array.isArray(body.gallery) && body.gallery.length ? body.gallery : [body.image];
      db.prepare(`
        INSERT INTO products (id, sku, name, price, old_price, stock, category, sub_category, featured, image, gallery, specs, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        String(body.sku).trim(),
        String(body.name).trim(),
        Math.round(Number(body.price)),
        Math.round(Number(body.oldPrice) || 0),
        Math.max(0, Math.round(Number(body.stock) || 0)),
        String(body.category).trim(),
        String(body.subCategory || '').trim(),
        body.featured ? 1 : 0,
        String(body.image).trim(),
        JSON.stringify(gal),
        String(body.specs || ''),
        String(body.description || '')
      );
      return this.getProductById(id);
    },

    async updateProduct(id, body) {
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (!existing) return null;
      const nextImage = body.image ?? existing.image;
      const nextGallery = Array.isArray(body.gallery)
        ? JSON.stringify(body.gallery.length ? body.gallery : [nextImage])
        : existing.gallery;

      db.prepare(`
        UPDATE products
        SET sku = ?, name = ?, price = ?, old_price = ?, stock = ?, category = ?, sub_category = ?,
            featured = ?, image = ?, gallery = ?, specs = ?, description = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        body.sku ?? existing.sku,
        body.name ?? existing.name,
        body.price !== undefined ? Math.round(Number(body.price)) : existing.price,
        body.oldPrice !== undefined ? Math.round(Number(body.oldPrice) || 0) : existing.old_price,
        body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock) || 0)) : existing.stock,
        body.category ?? existing.category,
        body.subCategory ?? existing.sub_category,
        body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
        nextImage,
        nextGallery,
        body.specs ?? existing.specs,
        body.description ?? existing.description,
        id
      );
      return this.getProductById(id);
    },

    async deleteProduct(id) {
      return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
    },

    async createOrder({ customerName, phone, email, address, note, paymentMethod, items }) {
      let totalAmount = 0;
      const verifiedItems = [];
      for (const item of items) {
        const qty = Math.max(1, Math.round(Number(item.qty) || 1));
        const dbProd = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
        const price = dbProd ? dbProd.price : Math.round(Number(item.price) || 0);
        const name = dbProd ? dbProd.name : String(item.name || 'Sản phẩm Xraptor');
        const image = dbProd ? dbProd.image : String(item.image || '');
        totalAmount += price * qty;
        verifiedItems.push({
          product_id: dbProd ? dbProd.id : String(item.productId || 'custom'),
          product_name: name,
          product_image: image,
          price,
          qty,
          hasDbProd: Boolean(dbProd),
        });
      }

      const orderCode = `XR-${Date.now().toString().slice(-6)}`;
      db.exec('BEGIN');
      try {
        const orderRes = db
          .prepare(
            `INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, total_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Chờ xác nhận')`
          )
          .run(
            orderCode,
            String(customerName).trim(),
            String(phone).trim(),
            String(email || '').trim(),
            String(address).trim(),
            String(note || '').trim(),
            String(paymentMethod || 'COD'),
            totalAmount
          );

        const insertItem = db.prepare(
          'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, qty) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const decStock = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');

        for (const vi of verifiedItems) {
          insertItem.run(orderRes.lastInsertRowid, vi.product_id, vi.product_name, vi.product_image, vi.price, vi.qty);
          if (vi.hasDbProd) decStock.run(vi.qty, vi.product_id);
        }
        db.exec('COMMIT');

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRes.lastInsertRowid);
        const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderRes.lastInsertRowid);
        return { ...order, items: orderItems };
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },

    async trackOrders(query) {
      const q = String(query || '').trim();
      const orders = db
        .prepare(
          `SELECT * FROM orders WHERE UPPER(order_code) = UPPER(?) OR REPLACE(phone, ' ', '') = REPLACE(?, ' ', '') ORDER BY id DESC`
        )
        .all(q, q);
      return orders.map((o) => ({
        ...o,
        items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
      }));
    },

    async listOrders({ status, search } = {}) {
      const where = [];
      const params = [];
      if (status && status !== 'Tất cả') {
        where.push('status = ?');
        params.push(String(status));
      }
      if (search) {
        where.push('(LOWER(order_code) LIKE ? OR LOWER(customer_name) LIKE ? OR phone LIKE ?)');
        const q = `%${String(search).toLowerCase()}%`;
        params.push(q, q, q);
      }
      const rows = db
        .prepare(`SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC`)
        .all(...params);
      return rows.map((o) => ({
        ...o,
        items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
      }));
    },

    async updateOrderStatus(id, status) {
      const r = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      if (r.changes === 0) return null;
      const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      return { ...o, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id) };
    },

    async deleteOrder(id) {
      return db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;
    },

    async createContact({ fullName, phone, email, orderCode, subject, message }) {
      const r = db
        .prepare(
          'INSERT INTO contacts (full_name, phone, email, order_code, subject, message) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(
          String(fullName).trim(),
          String(phone).trim(),
          String(email || '').trim(),
          String(orderCode || '').trim(),
          String(subject).trim(),
          String(message).trim()
        );
      return db.prepare('SELECT * FROM contacts WHERE id = ?').get(r.lastInsertRowid);
    },

    async listContacts() {
      return db.prepare('SELECT * FROM contacts ORDER BY id DESC').all();
    },

    async updateContactStatus(id, status) {
      const r = db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, id);
      if (r.changes === 0) return null;
      return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    },

    async deleteContact(id) {
      return db.prepare('DELETE FROM contacts WHERE id = ?').run(id).changes > 0;
    },

    async createSubscriber(email) {
      db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
      return { ok: true, email };
    },

    async listSubscribers() {
      return db.prepare('SELECT * FROM subscribers ORDER BY id DESC').all();
    },

    async deleteSubscriber(id) {
      db.prepare('DELETE FROM subscribers WHERE id = ?').run(id);
      return true;
    },

    async listBlogs() {
      return db.prepare('SELECT * FROM blogs ORDER BY rowid DESC').all().map(normalizeBlog);
    },

    async createBlog({ tag, date, title, excerpt, content, image }) {
      const id = `blog-${Date.now().toString(36)}`;
      const pubDate =
        date ||
        new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
      db.prepare(
        'INSERT INTO blogs (id, tag, published_date, title, excerpt, content, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, tag || 'Tin tức', pubDate, title.trim(), (excerpt || '').trim(), (content || '').trim(), image.trim());
      return normalizeBlog(db.prepare('SELECT * FROM blogs WHERE id = ?').get(id));
    },

    async updateBlog(id, body) {
      const existing = db.prepare('SELECT * FROM blogs WHERE id = ?').get(id);
      if (!existing) return null;
      db.prepare(
        'UPDATE blogs SET tag = ?, published_date = ?, title = ?, excerpt = ?, content = ?, image = ? WHERE id = ?'
      ).run(
        body.tag ?? existing.tag,
        body.date ?? existing.published_date,
        body.title ?? existing.title,
        body.excerpt ?? existing.excerpt,
        body.content ?? existing.content,
        body.image ?? existing.image,
        id
      );
      return normalizeBlog(db.prepare('SELECT * FROM blogs WHERE id = ?').get(id));
    },

    async deleteBlog(id) {
      return db.prepare('DELETE FROM blogs WHERE id = ?').run(id).changes > 0;
    },
  };
}

const store = USE_SUPABASE ? createSupabaseStore() : await createSqliteStore();
export default store;
