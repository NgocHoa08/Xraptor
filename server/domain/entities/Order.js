import { ValidationError } from '../errors/AppError.js';
import { normalizePaymentMethod, PAYMENT_STATUSES } from './Payment.js';

export const ORDER_STATUSES = Object.freeze([
  'Chờ xác nhận',
  'Đang xử lý',
  'Đang giao',
  'Hoàn thành',
  'Đã hủy',
]);

export function assertValidOrderStatus(status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new ValidationError('Trạng thái đơn hàng không hợp lệ.');
  }
}

export function generateOrderCode() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(10 + Math.random() * 89);
  return `XR-${ts}${rand}`;
}

export function validateCreateOrderInput(body = {}) {
  const { customerName, phone, email, address, note, paymentMethod, items } = body;
  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Vui lòng nhập đầy đủ thông tin nhận hàng và giỏ hàng.');
  }

  const normalizedMethod = normalizePaymentMethod(paymentMethod || 'COD');

  return {
    customerName: String(customerName).trim(),
    phone: String(phone).trim(),
    email: String(email || '').trim(),
    address: String(address).trim(),
    note: String(note || '').trim(),
    paymentMethod: normalizedMethod,
    items: items.map((item) => ({
      productId: item.productId,
      name: String(item.name || 'Sản phẩm Xraptor'),
      image: String(item.image || ''),
      price: Math.max(0, Math.round(Number(item.price) || 0)),
      qty: Math.max(1, Math.round(Number(item.qty) || 1)),
    })),
  };
}

export function normalizeOrder(row, items = [], latestPayment = null) {
  if (!row) return null;
  return {
    id: Number(row.id),
    order_code: row.order_code,
    customer_name: row.customer_name,
    phone: row.phone,
    email: row.email || '',
    address: row.address,
    note: row.note || '',
    payment_method: row.payment_method || 'COD',
    payment_status: row.payment_status || PAYMENT_STATUSES.UNPAID,
    total_amount: Number(row.total_amount || 0),
    status: row.status || 'Chờ xác nhận',
    paid_at: row.paid_at || null,
    created_at: row.created_at || null,
    items: Array.isArray(items) ? items : [],
    ...(latestPayment ? { payment: latestPayment } : {}),
  };
}
