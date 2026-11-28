import { normalizeOrder } from '../../../domain/entities/Order.js';
import { PAYMENT_STATUSES } from '../../../domain/entities/Payment.js';

export class SqliteOrderRepository {
  constructor(db) {
    this.db = db;
  }

  _hydrate(row) {
    if (!row) return null;
    const items = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id);
    return normalizeOrder(row, items);
  }

  async create(data) {
    this.db.exec('BEGIN');
    try {
      const res = this.db
        .prepare(
          `INSERT INTO orders (order_code, customer_name, phone, email, address, note, payment_method, payment_status, total_amount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          data.orderCode,
          data.customerName,
          data.phone,
          data.email,
          data.address,
          data.note,
          data.paymentMethod,
          data.paymentStatus,
          data.totalAmount,
          data.status
        );

      const insertItem = this.db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, product_image, price, qty) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const item of data.items) {
        insertItem.run(
          res.lastInsertRowid,
          item.productId,
          item.productName,
          item.productImage,
          item.price,
          item.qty
        );
      }
      this.db.exec('COMMIT');
      return this.findById(res.lastInsertRowid);
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  async findById(id) {
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return this._hydrate(row);
  }

  async findByOrderCode(orderCode) {
    const row = this.db
      .prepare('SELECT * FROM orders WHERE UPPER(order_code) = UPPER(?)')
      .get(orderCode);
    return this._hydrate(row);
  }

  async track(query) {
    const q = String(query || '').trim();
    const rows = this.db
      .prepare(
        `SELECT * FROM orders
         WHERE UPPER(order_code) = UPPER(?) OR REPLACE(phone, ' ', '') = REPLACE(?, ' ', '')
         ORDER BY id DESC`
      )
      .all(q, q);
    return rows.map((r) => this._hydrate(r));
  }

  async findAll({ status, paymentStatus, search } = {}) {
    const where = [];
    const params = [];
    if (status && status !== 'Tất cả') {
      where.push('status = ?');
      params.push(String(status));
    }
    if (paymentStatus && paymentStatus !== 'Tất cả') {
      where.push('payment_status = ?');
      params.push(String(paymentStatus));
    }
    if (search) {
      where.push('(LOWER(order_code) LIKE ? OR LOWER(customer_name) LIKE ? OR phone LIKE ?)');
      const q = `%${String(search).toLowerCase()}%`;
      params.push(q, q, q);
    }

    const rows = this.db
      .prepare(`SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC`)
      .all(...params);
    return rows.map((r) => this._hydrate(r));
  }

  async updateStatus(id, status) {
    const res = this.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    if (res.changes === 0) return null;
    return this.findById(id);
  }

  async updatePaymentStatus(id, paymentStatus, paidAt) {
    this.db
      .prepare('UPDATE orders SET payment_status = ?, paid_at = COALESCE(?, paid_at) WHERE id = ?')
      .run(paymentStatus, paidAt || null, id);
    return this.findById(id);
  }

  async updatePaymentMethodAndStatus(id, paymentMethod, paymentStatus) {
    this.db
      .prepare('UPDATE orders SET payment_method = ?, payment_status = ? WHERE id = ?')
      .run(paymentMethod, paymentStatus, id);
    return this.findById(id);
  }

  async markOrderPaid(id, paidAt) {
    this.db
      .prepare(
        `UPDATE orders
         SET payment_status = ?,
             paid_at = ?,
             status = CASE WHEN status = 'Chờ xác nhận' THEN 'Đang xử lý' ELSE status END
         WHERE id = ?`
      )
      .run(PAYMENT_STATUSES.PAID, paidAt, id);
    return this.findById(id);
  }

  async delete(id) {
    return this.db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;
  }
}
