import { normalizePayment, PAYMENT_STATUSES } from '../../../domain/entities/Payment.js';

export class SqlitePaymentRepository {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const res = this.db
      .prepare(
        `INSERT INTO payments (
          transaction_code, order_id, order_code, provider, method, amount, currency,
          status, payment_url, qr_url, bank_info, metadata, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'VND', ?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        data.transactionCode,
        data.orderId,
        data.orderCode,
        data.provider,
        data.method,
        data.amount,
        data.status,
        data.paymentUrl || '',
        data.qrUrl || '',
        JSON.stringify(data.bankInfo || {}),
        JSON.stringify(data.metadata || {})
      );
    return this.findById(res.lastInsertRowid);
  }

  async findById(id) {
    const row = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    return normalizePayment(row);
  }

  async findByTransactionCode(transactionCode) {
    const row = this.db
      .prepare('SELECT * FROM payments WHERE transaction_code = ?')
      .get(transactionCode);
    return normalizePayment(row);
  }

  async findLatestByOrderId(orderId) {
    const row = this.db
      .prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1')
      .get(orderId);
    return normalizePayment(row);
  }

  async findAll({ status, method, search } = {}) {
    const where = [];
    const params = [];

    if (status && status !== 'Tất cả') {
      where.push('status = ?');
      params.push(String(status));
    }
    if (method && method !== 'Tất cả') {
      where.push('method = ?');
      params.push(String(method).toUpperCase());
    }
    if (search) {
      where.push('(LOWER(transaction_code) LIKE ? OR LOWER(order_code) LIKE ? OR LOWER(gateway_txn_no) LIKE ?)');
      const q = `%${String(search).toLowerCase()}%`;
      params.push(q, q, q);
    }

    const rows = this.db
      .prepare(`SELECT * FROM payments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC`)
      .all(...params);
    return rows.map(normalizePayment);
  }

  async markPaid(id, { gatewayTxnNo = '', confirmedBy = '', paidAt, metadata } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    this.db
      .prepare(
        `UPDATE payments
         SET status = ?, gateway_txn_no = ?, confirmed_by = ?, paid_at = ?,
             metadata = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(
        PAYMENT_STATUSES.PAID,
        gatewayTxnNo,
        confirmedBy,
        paidAt,
        JSON.stringify(metadata ?? existing.metadata),
        id
      );
    return this.findById(id);
  }

  async markFailed(id, { gatewayTxnNo = '', metadata } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    this.db
      .prepare(
        `UPDATE payments
         SET status = ?, gateway_txn_no = ?, metadata = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(
        PAYMENT_STATUSES.FAILED,
        gatewayTxnNo,
        JSON.stringify(metadata ?? existing.metadata),
        id
      );
    return this.findById(id);
  }

  async markRefunded(id, { confirmedBy = '', refundedAt, metadata } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    this.db
      .prepare(
        `UPDATE payments
         SET status = ?, confirmed_by = ?, refunded_at = ?, metadata = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(
        PAYMENT_STATUSES.REFUNDED,
        confirmedBy,
        refundedAt,
        JSON.stringify(metadata ?? existing.metadata),
        id
      );
    return this.findById(id);
  }
}
