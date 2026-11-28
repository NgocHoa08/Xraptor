import crypto from 'crypto';
import { PAYMENT_STATUSES } from '../../domain/entities/Payment.js';

/**
 * Built-in cryptographically signed VNPay Sandbox Simulator.
 * Automatically active when VNPAY_TMN_CODE / VNPAY_HASH_SECRET are not set,
 * allowing full end-to-end online checkout & HMAC webhook verification locally and on Vercel.
 */
export class SandboxOnlineGateway {
  constructor({ signingSecret }) {
    this.signingSecret = signingSecret;
  }

  sign({ transactionCode, orderCode, amount }) {
    const payload = `${transactionCode}|${orderCode}|${Math.round(amount)}`;
    return crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
  }

  verify({ transactionCode, orderCode, amount, signature }) {
    const expected = this.sign({ transactionCode, orderCode, amount });
    const sigBuf = Buffer.from(String(signature || ''));
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  async createPayment({ orderCode, transactionCode, amount }) {
    const signature = this.sign({ transactionCode, orderCode, amount });
    return {
      provider: 'SANDBOX',
      status: PAYMENT_STATUSES.PENDING,
      paymentUrl: '',
      qrUrl: '',
      bankInfo: {},
      metadata: {
        mode: 'vnpay-sandbox-simulator',
        sandboxSignature: signature,
        supportedBanks: [
          { code: 'NCB', name: 'Ngân hàng NCB (Thẻ test VNPay)' },
          { code: 'VNPAYQR', name: 'Ứng dụng quét mã VNPAY-QR' },
          { code: 'VCB', name: 'Vietcombank ATM / Internet Banking' },
          { code: 'VISA', name: 'Thẻ quốc tế Visa / Mastercard' },
        ],
      },
    };
  }
}
