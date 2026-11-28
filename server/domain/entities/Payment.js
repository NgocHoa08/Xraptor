import { ConflictError, ValidationError } from '../errors/AppError.js';

export const PAYMENT_METHODS = Object.freeze({
  COD: 'COD',
  VIETQR: 'VIETQR',
  VNPAY: 'VNPAY',
});

export const PAYMENT_METHOD_META = Object.freeze({
  [PAYMENT_METHODS.COD]: {
    id: PAYMENT_METHODS.COD,
    label: 'Thanh toán khi nhận hàng (COD)',
    shortLabel: 'COD',
    description: 'Kiểm tra vợt & phụ kiện rồi thanh toán tiền mặt cho đơn vị vận chuyển.',
  },
  [PAYMENT_METHODS.VIETQR]: {
    id: PAYMENT_METHODS.VIETQR,
    label: 'Chuyển khoản VietQR',
    shortLabel: 'VietQR',
    description: 'Quét mã QR ngân hàng tự động điền số tiền và mã đơn hàng.',
  },
  [PAYMENT_METHODS.VNPAY]: {
    id: PAYMENT_METHODS.VNPAY,
    label: 'Thanh toán trực tuyến VNPay',
    shortLabel: 'VNPay',
    description: 'Thanh toán qua cổng VNPay (ATM nội địa / QR / Visa / Mastercard).',
  },
});

export const PAYMENT_STATUSES = Object.freeze({
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
});

export const VALID_PAYMENT_STATUSES = Object.freeze(Object.values(PAYMENT_STATUSES));

export function normalizePaymentMethod(raw) {
  const v = String(raw || 'COD').trim().toUpperCase();
  if (v === 'COD') return PAYMENT_METHODS.COD;
  if (v === 'VIETQR' || v === 'CHUYỂN KHOẢN' || v === 'BANK' || v === 'BANK_TRANSFER') {
    return PAYMENT_METHODS.VIETQR;
  }
  if (v === 'VNPAY' || v === 'ONLINE' || v === 'SANDBOX') {
    return PAYMENT_METHODS.VNPAY;
  }
  throw new ValidationError(`Phương thức thanh toán "${raw}" không được hỗ trợ.`);
}

export function generateTransactionCode(orderCode) {
  const cleanOrder = String(orderCode || 'XR').replace(/[^A-Za-z0-9]/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PAY-${cleanOrder}-${rand}`;
}

function safeParseJson(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function normalizePayment(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    transactionCode: row.transaction_code,
    orderId: Number(row.order_id),
    orderCode: row.order_code,
    provider: row.provider,
    method: row.method,
    amount: Number(row.amount || 0),
    currency: row.currency || 'VND',
    status: row.status || PAYMENT_STATUSES.UNPAID,
    gatewayTxnNo: row.gateway_txn_no || '',
    paymentUrl: row.payment_url || '',
    qrUrl: row.qr_url || '',
    bankInfo: safeParseJson(row.bank_info, {}),
    metadata: safeParseJson(row.metadata, {}),
    confirmedBy: row.confirmed_by || '',
    paidAt: row.paid_at || null,
    refundedAt: row.refunded_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function assertCanConfirmPayment(payment) {
  if (payment.status === PAYMENT_STATUSES.PAID) {
    throw new ConflictError('Giao dịch này đã được xác nhận thanh toán trước đó.');
  }
  if (payment.status === PAYMENT_STATUSES.REFUNDED) {
    throw new ConflictError('Không thể xác nhận giao dịch đã hoàn tiền.');
  }
}

export function assertCanRefundPayment(payment) {
  if (payment.status !== PAYMENT_STATUSES.PAID) {
    throw new ConflictError('Chỉ có thể hoàn tiền cho giao dịch đã ở trạng thái "Đã thanh toán".');
  }
}
