import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import store from './store.js';
import { createToken, hashPassword, requireAdmin, verifyPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../public/uploads');

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));
app.use('/uploads', express.static(uploadsDir));

// Use memoryStorage so images upload seamlessly to Supabase Storage OR local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận tệp hình ảnh.'));
  },
});

// ======================== HEALTH ========================
app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    service: 'xraptor-api',
    database: store.mode,
    timestamp: new Date().toISOString(),
  });
});

// ======================== AUTH ========================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
  }
  const admin = await store.getAdminByEmail(String(email).trim().toLowerCase());
  if (!admin || !verifyPassword(String(password), admin.password_hash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  }
  const token = createToken({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
  res.json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
});

app.get('/api/auth/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin, database: store.mode });
});

app.post('/api/auth/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }
  const admin = await store.getAdminById(req.admin.id);
  if (!admin || !verifyPassword(String(currentPassword), admin.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
  }
  await store.updateAdminPassword(admin.id, hashPassword(String(newPassword)));
  res.json({ ok: true, message: 'Đổi mật khẩu thành công.' });
});

// ======================== UPLOAD ========================
app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Chưa chọn tệp hình ảnh.' });
  }
  const url = await store.uploadImage(req.file);
  res.json({ url });
});

// ======================== DASHBOARD ========================
app.get('/api/dashboard', requireAdmin, async (_req, res) => {
  const data = await store.getDashboard();
  res.json(data);
});

// ======================== PRODUCTS ========================
app.get('/api/products', async (req, res) => {
  const products = await store.listProducts(req.query);
  res.json({ products });
});

app.get('/api/products/:id', async (req, res) => {
  const product = await store.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json({ product });
});

app.post('/api/products', requireAdmin, async (req, res) => {
  const { sku, name, price, category, image } = req.body || {};
  if (!name || !sku || !category || !image || Number(price) <= 0) {
    return res
      .status(400)
      .json({ error: 'Vui lòng điền đầy đủ Mã SKU, Tên, Danh mục, Giá và Hình ảnh.' });
  }
  const product = await store.createProduct(req.body);
  res.status(201).json({ product });
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const product = await store.updateProduct(req.params.id, req.body || {});
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json({ product });
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const deleted = await store.deleteProduct(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json({ ok: true });
});

// ======================== ORDERS ========================
app.post('/api/orders', async (req, res) => {
  const { customerName, phone, address, items } = req.body || {};
  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin nhận hàng và giỏ hàng.' });
  }
  const order = await store.createOrder(req.body);
  res.status(201).json({ order });
});

app.get('/api/orders/track/:query', async (req, res) => {
  const orders = await store.trackOrders(req.params.query);
  res.json({ orders });
});

app.get('/api/orders', requireAdmin, async (req, res) => {
  const orders = await store.listOrders(req.query);
  res.json({ orders });
});

app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  const allowed = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
  const { status } = req.body || {};
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ.' });
  }
  const order = await store.updateOrderStatus(req.params.id, status);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  res.json({ order });
});

app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  const deleted = await store.deleteOrder(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  res.json({ ok: true });
});

// ======================== CONTACTS ========================
app.post('/api/contacts', async (req, res) => {
  const { fullName, phone, subject, message } = req.body || {};
  if (!fullName || !phone || !subject || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
  }
  const contact = await store.createContact(req.body);
  res.status(201).json({ contact });
});

app.get('/api/contacts', requireAdmin, async (_req, res) => {
  const contacts = await store.listContacts();
  res.json({ contacts });
});

app.patch('/api/contacts/:id', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!['Chưa xử lý', 'Đã xử lý'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  }
  const contact = await store.updateContactStatus(req.params.id, status);
  if (!contact) return res.status(404).json({ error: 'Không tìm thấy liên hệ.' });
  res.json({ contact });
});

app.delete('/api/contacts/:id', requireAdmin, async (req, res) => {
  const deleted = await store.deleteContact(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Không tìm thấy liên hệ.' });
  res.json({ ok: true });
});

// ======================== SUBSCRIBERS ========================
app.post('/api/subscribers', async (req, res) => {
  const cleaned = String(req.body?.email || '').trim().toLowerCase();
  if (!cleaned || !cleaned.includes('@')) {
    return res.status(400).json({ error: 'Email không hợp lệ.' });
  }
  const result = await store.createSubscriber(cleaned);
  res.status(201).json(result);
});

app.get('/api/subscribers', requireAdmin, async (_req, res) => {
  const subscribers = await store.listSubscribers();
  res.json({ subscribers });
});

app.delete('/api/subscribers/:id', requireAdmin, async (req, res) => {
  await store.deleteSubscriber(req.params.id);
  res.json({ ok: true });
});

// ======================== BLOGS ========================
app.get('/api/blogs', async (_req, res) => {
  const blogs = await store.listBlogs();
  res.json({ blogs });
});

app.post('/api/blogs', requireAdmin, async (req, res) => {
  const { title, image } = req.body || {};
  if (!title || !image) {
    return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và hình ảnh bài viết.' });
  }
  const blog = await store.createBlog(req.body);
  res.status(201).json({ blog });
});

app.put('/api/blogs/:id', requireAdmin, async (req, res) => {
  const blog = await store.updateBlog(req.params.id, req.body || {});
  if (!blog) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
  res.json({ blog });
});

app.delete('/api/blogs/:id', requireAdmin, async (req, res) => {
  const deleted = await store.deleteBlog(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
  res.json({ ok: true });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err);
  res.status(400).json({ error: err.message || 'Đã có lỗi xảy ra.' });
});

export default app;
