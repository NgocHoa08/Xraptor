import { normalizePayment, PAYMENT_STATUSES } from '../../../domain/entities/Payment.js';

export class SupabasePaymentRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  async create(data) {
    await this.ensureSeeded();
    const { data: row, error } = await this.supabase
      .from('payments')
      .insert({
        transaction_code: data.transactionCode,
        order_id: data.orderId,
        order_code: data.orderCode,
        provider: data.provider,
        method: data.method,
        amount: data.amount,
        currency: 'VND',
        status: data.status,
        payment_url: data.paymentUrl || '',
        qr_url: data.qrUrl || '',
        bank_info: data.bankInfo || {},
        metadata: data.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return normalizePayment(row);
  }

  async findById(id) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizePayment(data);
  }

  async findByTransactionCode(transactionCode) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('transaction_code', transactionCode)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizePayment(data);
  }

  async findLatestByOrderId(orderId) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizePayment(data);
  }

  async findAll({ status, method, search } = {}) {
    await this.ensureSeeded();
    let q = this.supabase.from('payments').select('*').order('id', { ascending: false });
    if (status && status !== 'Tất cả') q = q.eq('status', String(status));
    if (method && method !== 'Tất cả') q = q.eq('method', String(method).toUpperCase());

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    let list = (data || []).map(normalizePayment);
    if (search) {
      const term = String(search).toLowerCase();
      list = list.filter(
        (p) =>
          p.transactionCode.toLowerCase().includes(term) ||
          p.orderCode.toLowerCase().includes(term) ||
          p.gatewayTxnNo.toLowerCase().includes(term)
      );
    }
    return list;
  }

  async markPaid(id, { gatewayTxnNo = '', confirmedBy = '', paidAt, metadata } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const { data, error } = await this.supabase
      .from('payments')
      .update({
        status: PAYMENT_STATUSES.PAID,
        gateway_txn_no: gatewayTxnNo,
        confirmed_by: confirmedBy,
        paid_at: paidAt,
        metadata: metadata ?? existing.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizePayment(data);
  }

  async markFailed(id, { gatewayTxnNo = '', metadata } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const { data, error } = await this.supabase
      .from('payments')
      .update({
        status: PAYMENT_STATUSES.FAILED,
        gateway_txn_no: gatewayTxnNo,
        metadata: metadata ?? existing.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizePayment(data);
  }

  async markRefunded(id, { confirmedBy = '', refundedAt, metadata } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const { data, error } = await this.supabase
      .from('payments')
      .update({
        status: PAYMENT_STATUSES.REFUNDED,
        confirmed_by: confirmedBy,
        refunded_at: refundedAt,
        metadata: metadata ?? existing.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizePayment(data);
  }
}
