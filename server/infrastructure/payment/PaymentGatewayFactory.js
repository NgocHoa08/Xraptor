import { PAYMENT_METHODS, PAYMENT_STATUSES } from '../../domain/entities/Payment.js';

export class PaymentGatewayFactory {
  constructor({ vietQrGateway, vnpayGateway, sandboxGateway }) {
    this.vietQrGateway = vietQrGateway;
    this.vnpayGateway = vnpayGateway;
    this.sandboxGateway = sandboxGateway;
  }

  getCapabilities() {
    return {
      bankName: this.vietQrGateway.bankName,
      vnpayMode: this.vnpayGateway.isConfigured() ? 'vnpay-live-sandbox' : 'vnpay-sandbox-simulator',
    };
  }

  async createPayment(params) {
    if (params.method === PAYMENT_METHODS.COD) {
      return {
        provider: 'COD',
        status: PAYMENT_STATUSES.UNPAID,
        paymentUrl: '',
        qrUrl: '',
        bankInfo: {},
        metadata: { note: 'Thanh toán tiền mặt khi nhận hàng' },
      };
    }

    if (params.method === PAYMENT_METHODS.VIETQR) {
      return this.vietQrGateway.createPayment(params);
    }

    if (params.method === PAYMENT_METHODS.VNPAY) {
      if (this.vnpayGateway.isConfigured()) {
        return this.vnpayGateway.createPayment(params);
      }
      return this.sandboxGateway.createPayment(params);
    }

    throw new Error(`Unsupported payment method: ${params.method}`);
  }

  verifyVnpayCallback(queryParams) {
    return this.vnpayGateway.verifyCallback(queryParams);
  }

  verifySandboxSignature(payload) {
    return this.sandboxGateway.verify(payload);
  }
}
