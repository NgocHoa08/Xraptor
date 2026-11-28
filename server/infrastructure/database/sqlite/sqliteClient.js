import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import {
  SEED_ADMINS,
  SEED_BLOGS,
  SEED_CONTACTS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_SUBSCRIBERS,
} from '../seedData.js';
import {
  generateTransactionCode,
  normalizePaymentMethod,
  PAYMENT_STATUSES,
} from '../../../domain/entities/Payment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function hasColumn(db, table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

export function createSqliteClient({ sqlitePath = null, isVercel = false, passwordHasher, vietqr }) {
  let dbPath = sqlitePath;
  if (!dbPath) {
    const dataDir = isVercel
      ? '/tmp/xraptor-data'
      : path.resolve(__dirname, '../../../data');
    fs.mkdirSync(dataDir, { recursive: true });
    dbPath = path.join(dataDir, 'xraptor.db');
  } else if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      payment_status TEXT DEFAULT 'Chưa thanh toán',
      total_amount INTEGER NOT NULL,
      status TEXT DEFAULT 'Chờ xác nhận',
      paid_at TEXT,
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

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_code TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_code TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'COD',
      method TEXT NOT NULL DEFAULT 'COD',
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'VND',
      status TEXT DEFAULT 'Chưa thanh toán',
      gateway_txn_no TEXT DEFAULT '',
      payment_url TEXT DEFAULT '',
      qr_url TEXT DEFAULT '',
      bank_info TEXT DEFAULT '{}',
      metadata TEXT DEFAULT '{}',
      confirmed_by TEXT DEFAULT '',
      paid_at TEXT,
      refunded_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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

  // Safe migrations for existing xraptor.db files
  if (!hasColumn(db, 'admins', 'is_active')) {
    db.exec('ALTER TABLE admins ADD COLUMN is_active INTEGER DEFAULT 1');
  }
  if (!hasColumn(db, 'admins', 'updated_at')) {
    db.exec('ALTER TABLE admins ADD COLUMN updated_at TEXT');
  }
  if (!hasColumn(db, 'orders', 'payment_status')) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Chưa thanh toán'");
    db.exec(
      `UPDATE orders SET payment_status = '${PAYMENT_STATUSES.PAID}' WHERE status = 'Hoàn thành'`
    );
  }
  if (!hasColumn(db, 'orders', 'paid_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN paid_at TEXT');
  }

  // Seed default RBAC staff accounts (idempotent by email)
  const insertAdmin = db.prepare(
    'INSERT OR IGNORE INTO admins (email, name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)'
  );
  for (const a of SEED_ADMINS) {
    insertAdmin.run(a.email, a.name, passwordHasher.hash(a.password), a.role, a.isActive ? 1 : 0);
  }

  // Seed products
  if (db.prepare('SELECT COUNT(*) AS cnt FROM products').get().cnt === 0) {
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

  // Seed blogs
  if (db.prepare('SELECT COUNT(*) AS cnt FROM blogs').get().cnt === 0) {
    const insertBlog = db.prepare(
      'INSERT INTO blogs (id, tag, published_date, title, excerpt, content, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const b of SEED_BLOGS) {
      insertBlog.run(b.id, b.tag, b.published_date, b.title, b.excerpt, b.content, b.image);
    }
  }

  // Seed orders
  if (db.prepare('SELECT COUNT(*) AS cnt FROM orders').get().cnt === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, payment_status, total_amount, status, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, qty)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const o of SEED_ORDERS) {
      const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
      const method = normalizePaymentMethod(o.payment_method);
      const isPaid = o.status === 'Hoàn thành' || o.status === 'Đang giao';
      const payStatus = isPaid
        ? PAYMENT_STATUSES.PAID
        : method === 'COD'
          ? PAYMENT_STATUSES.UNPAID
          : PAYMENT_STATUSES.PENDING;
      const paidAt = isPaid ? new Date().toISOString() : null;

      const res = insertOrder.run(
        o.order_code,
        o.customer_name,
        o.phone,
        o.email,
        o.address,
        o.note,
        method,
        payStatus,
        total,
        o.status,
        paidAt
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

  // Backfill payment records for existing orders without payments
  if (db.prepare('SELECT COUNT(*) AS cnt FROM payments').get().cnt === 0) {
    const orders = db.prepare('SELECT * FROM orders ORDER BY id ASC').all();
    const insertPayment = db.prepare(`
      INSERT INTO payments (
        transaction_code, order_id, order_code, provider, method, amount, status,
        gateway_txn_no, qr_url, bank_info, confirmed_by, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const o of orders) {
      let method = 'COD';
      try {
        method = normalizePaymentMethod(o.payment_method);
      } catch {
        method = 'COD';
      }
      const isPaid = o.payment_status === PAYMENT_STATUSES.PAID || o.status === 'Hoàn thành';
      const status = isPaid
        ? PAYMENT_STATUSES.PAID
        : method === 'COD'
          ? PAYMENT_STATUSES.UNPAID
          : PAYMENT_STATUSES.PENDING;
      const transferContent = `XRAPTOR ${o.order_code}`;
      const qrUrl =
        method === 'VIETQR' && vietqr
          ? `https://img.vietqr.io/image/${encodeURIComponent(vietqr.bankCode)}-${encodeURIComponent(
              vietqr.accountNo
            )}-compact2.png?amount=${o.total_amount}&addInfo=${encodeURIComponent(
              transferContent
            )}&accountName=${encodeURIComponent(vietqr.accountName)}`
          : '';
      const bankInfo =
        method === 'VIETQR' && vietqr
          ? JSON.stringify({
              ...vietqr,
              transferContent,
              amount: o.total_amount,
            })
          : '{}';

      insertPayment.run(
        generateTransactionCode(o.order_code),
        o.id,
        o.order_code,
        method,
        method,
        o.total_amount,
        status,
        isPaid ? `SEED-${o.order_code}` : '',
        qrUrl,
        bankInfo,
        isPaid ? 'admin@xraptor.vn' : '',
        isPaid ? o.paid_at || o.created_at : null
      );
    }
  }

  // Seed contacts
  if (db.prepare('SELECT COUNT(*) AS cnt FROM contacts').get().cnt === 0) {
    const insertContact = db.prepare(
      'INSERT INTO contacts (full_name, phone, email, order_code, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const c of SEED_CONTACTS) {
      insertContact.run(
        c.full_name,
        c.phone,
        c.email,
        c.order_code,
        c.subject,
        c.message,
        c.status
      );
    }
  }

  // Seed subscribers
  if (db.prepare('SELECT COUNT(*) AS cnt FROM subscribers').get().cnt === 0) {
    const insertSub = db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)');
    for (const email of SEED_SUBSCRIBERS) {
      insertSub.run(email);
    }
  }

  return db;
}
