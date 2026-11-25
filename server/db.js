import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth.js';
import {
  SEED_PRODUCTS,
  SEED_BLOGS,
  SEED_ORDERS,
  SEED_CONTACTS,
  SEED_SUBSCRIBERS,
} from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp/xraptor-data' : path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'xraptor.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'superadmin',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    old_price INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    sub_category TEXT DEFAULT '',
    featured INTEGER DEFAULT 0,
    image TEXT NOT NULL,
    gallery TEXT DEFAULT '[]',
    specs TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    address TEXT NOT NULL,
    note TEXT DEFAULT '',
    payment_method TEXT DEFAULT 'COD',
    total_amount INTEGER NOT NULL,
    status TEXT DEFAULT 'Chờ xác nhận',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT DEFAULT '',
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    order_code TEXT DEFAULT '',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Chưa xử lý',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    tag TEXT DEFAULT 'Tin tức',
    published_date TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    image TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function seedIfEmpty() {
  const adminCount = db.prepare('SELECT COUNT(*) AS cnt FROM admins').get().cnt;
  if (adminCount === 0) {
    db.prepare(
      'INSERT INTO admins (email, name, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run('admin@xraptor.vn', 'Quản trị viên Xraptor', hashPassword('admin123'), 'superadmin');
  }

  const prodCount = db.prepare('SELECT COUNT(*) AS cnt FROM products').get().cnt;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (id, sku, name, price, old_price, stock, category, sub_category, featured, image, gallery, specs, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of SEED_PRODUCTS) {
      insertProd.run(
        p.id,
        p.sku,
        p.name,
        p.price,
        p.old_price || 0,
        p.stock || 0,
        p.category,
        p.sub_category || '',
        p.featured ? 1 : 0,
        p.image,
        JSON.stringify(p.gallery || [p.image]),
        p.specs || '',
        p.description || ''
      );
    }
  }

  const blogCount = db.prepare('SELECT COUNT(*) AS cnt FROM blogs').get().cnt;
  if (blogCount === 0) {
    const insertBlog = db.prepare(
      'INSERT INTO blogs (id, tag, published_date, title, excerpt, content, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const b of SEED_BLOGS) {
      insertBlog.run(b.id, b.tag, b.published_date, b.title, b.excerpt, b.content, b.image);
    }
  }

  const orderCount = db.prepare('SELECT COUNT(*) AS cnt FROM orders').get().cnt;
  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, qty)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const o of SEED_ORDERS) {
      const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
      const res = insertOrder.run(
        o.order_code,
        o.customer_name,
        o.phone,
        o.email,
        o.address,
        o.note,
        o.payment_method,
        total,
        o.status
      );
      for (const item of o.items) {
        insertItem.run(
          res.lastInsertRowid,
          item.product_id,
          item.product_name,
          item.product_image,
          item.price,
          item.qty
        );
      }
    }
  }

  const contactCount = db.prepare('SELECT COUNT(*) AS cnt FROM contacts').get().cnt;
  if (contactCount === 0) {
    const insertContact = db.prepare(
      'INSERT INTO contacts (full_name, phone, email, order_code, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const c of SEED_CONTACTS) {
      insertContact.run(c.full_name, c.phone, c.email, c.order_code, c.subject, c.message, c.status);
    }
  }

  const subCount = db.prepare('SELECT COUNT(*) AS cnt FROM subscribers').get().cnt;
  if (subCount === 0) {
    const insertSub = db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)');
    for (const email of SEED_SUBSCRIBERS) {
      insertSub.run(email);
    }
  }
}

seedIfEmpty();

export function formatProduct(row) {
  if (!row) return null;
  let gallery = [];
  try {
    gallery = JSON.parse(row.gallery || '[]');
  } catch {
    gallery = [row.image];
  }
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    oldPrice: row.old_price || 0,
    stock: row.stock,
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

export default db;
