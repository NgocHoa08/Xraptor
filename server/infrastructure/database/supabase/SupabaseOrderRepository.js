import { normalizeOrder } from '../../../domain/entities/Order.js';
import { PAYMENT_STATUSES } from '../../../domain/entities/Payment.js';

export class SupabaseOrderRepository {
  constructor({ supabase, ensureSeeded }) {
    this.supabase = supabase;
    this.ensureSeeded = ensureSeeded;
  }

  _mapRow(row) {
    if (!row) return null;
    const { order_items, ...rest } = row;
    return normalizeOrder(rest, order_items || []);
  }

  async create(data) {
    await this.ensureSeeded();
    const { data: order, error } = await this.supabase
      .from('orders')
      .insert({
        order_code: data.orderCode,
        customer_name: data.customerName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        note: data.note,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
        total_amount: data.totalAmount,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: items, error: itemErr } = await this.supabase
      .from('order_items')
      .insert(
        data.items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          product_image: item.productImage,
          price: item.price,
          qty: item.qty,
        }))
      )
      .select();
    if (itemErr) throw new Error(itemErr.message);

    return normalizeOrder(order, items || []);
  }

  async findById(id) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return this._mapRow(data);
  }

  async findByOrderCode(orderCode) {
    await this.ensureSeeded();
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('order_code', orderCode)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return this._mapRow(data);
  }

  async track(query) {
    await this.ensureSeeded();
    const qClean = String(query || '').trim();
    const qNoSpace = qClean.replace(/\s+/g, '');
    const { data, error } = await this.supabase
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
      .map((r) => this._mapRow(r));
  }

  async findAll({ status, paymentStatus, search } = {}) {
    await this.ensureSeeded();
    let q = this.supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('id', { ascending: false });
    if (status && status !== 'Tất cả') q = q.eq('status', String(status));
    if (paymentStatus && paymentStatus !== 'Tất cả') {
      q = q.eq('payment_status', String(paymentStatus));
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    let list = (data || []).map((r) => this._mapRow(r));
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
  }

  async updateStatus(id, status) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return this._mapRow(data);
  }

  async updatePaymentStatus(id, paymentStatus, paidAt) {
    const patch = { payment_status: paymentStatus };
    if (paidAt) patch.paid_at = paidAt;
    const { data, error } = await this.supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return this._mapRow(data);
  }

  async updatePaymentMethodAndStatus(id, paymentMethod, paymentStatus) {
    const { data, error } = await this.supabase
      .from('orders')
      .update({ payment_method: paymentMethod, payment_status: paymentStatus })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return this._mapRow(data);
  }

  async markOrderPaid(id, paidAt) {
    const current = await this.findById(id);
    if (!current) return null;
    const nextStatus = current.status === 'Chờ xác nhận' ? 'Đang xử lý' : current.status;
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        payment_status: PAYMENT_STATUSES.PAID,
        paid_at: paidAt,
        status: nextStatus,
      })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return this._mapRow(data);
  }

  async delete(id) {
    const { error, count } = await this.supabase
      .from('orders')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  }
}
