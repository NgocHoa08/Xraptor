import crypto from 'crypto';
import { PAYMENT_STATUSES } from '../../domain/entities/Payment.js';

function formatVnpDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  // VNPay expects GMT+7 timestamp: YYYYMMDDHHmmss
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return [
    vnTime.getUTCFullYear(),
    pad(vnTime.getUTCMonth() + 1),
    pad(vnTime.getUTCDate()),
    pad(vnTime.getUTCHours()),
    pad(vnTime.getUTCMinutes()),
    pad(vnTime.getUTCSeconds()),
  ].join('');
}

function sortAndEncodeParams(params) {
  const sorted = {};
  const keys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort();

  for (const key of keys) {
    sorted[encodeURIComponent(key)] = encodeURIComponent(String(params[key])).replace(/%20/g, '+');
  }
  return sorted;
}

function buildSignData(sortedParams) {
  return Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

export class VnpayGateway {
  constructor({ tmnCode, hashSecret, paymentUrl, returnUrl }) {
    this.tmnCode = tmnCode;
    this.hashSecret = hashSecret;
    this.paymentUrl = paymentUrl;
    this.returnUrl = returnUrl;
  }

  isConfigured() {
    return Boolean(this.tmnCode && this.hashSecret);
  }

  async createPayment({ orderCode, transactionCode, amount, clientIp = '127.0.0.1' }) {
    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000);
    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionCode,
      vnp_OrderInfo: `Thanh toan don hang ${orderCode} tai Xraptor`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(amount) * 100,
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: clientIp === '::1' ? '127.0.0.1' : clientIp,
      vnp_CreateDate: formatVnpDate(now),
      vnp_ExpireDate: formatVnpDate(expire),
    };

    const sorted = sortAndEncodeParams(vnpParams);
    const signData = buildSignData(sorted);
    const secureHash = crypto
      .createHmac('sha512', this.hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const fullUrl = `${this.paymentUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    return {
      provider: 'VNPAY',
      status: PAYMENT_STATUSES.PENDING,
      paymentUrl: fullUrl,
      qrUrl: '',
      bankInfo: {},
      metadata: {
        mode: 'vnpay-live-sandbox',
        txnRef: transactionCode,
        expiresAt: expire.toISOString(),
      },
    };
  }

  verifyCallback(rawQuery = {}) {
    const query = { ...rawQuery };
    const receivedHash = String(query.vnp_SecureHash || '');
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sorted = sortAndEncodeParams(query);
    const signData = buildSignData(sorted);
    const expectedHash = crypto
      .createHmac('sha512', this.hashSecret || '')
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const validSignature =
      Boolean(this.hashSecret) &&
      receivedHash.length === expectedHash.length &&
      crypto.timingSafeEqual(
        Buffer.from(receivedHash.toLowerCase()),
        Buffer.from(expectedHash.toLowerCase())
      );

    const responseCode = String(rawQuery.vnp_ResponseCode || '');
    const txnStatus = String(rawQuery.vnp_TransactionStatus || responseCode);

    return {
      validSignature,
      transactionCode: String(rawQuery.vnp_TxnRef || ''),
      amount: Math.round(Number(rawQuery.vnp_Amount || 0) / 100),
      gatewayTxnNo: String(rawQuery.vnp_TransactionNo || ''),
      responseCode,
      isSuccess: validSignature && responseCode === '00' && txnStatus === '00',
    };
  }
}
