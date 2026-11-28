import { PAYMENT_STATUSES } from '../../domain/entities/Payment.js';

export class VietQrGateway {
  constructor({ bankCode, bankName, accountNo, accountName }) {
    this.bankCode = bankCode;
    this.bankName = bankName;
    this.accountNo = accountNo;
    this.accountName = accountName;
  }

  async createPayment({ orderCode, amount }) {
    const transferContent = `XRAPTOR ${orderCode}`;
    const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(this.bankCode)}-${encodeURIComponent(
      this.accountNo
    )}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(this.accountName)}`;

    return {
      provider: 'VIETQR',
      status: PAYMENT_STATUSES.PENDING,
      qrUrl,
      paymentUrl: '',
      bankInfo: {
        bankCode: this.bankCode,
        bankName: this.bankName,
        accountNo: this.accountNo,
        accountName: this.accountName,
        transferContent,
        amount: Math.round(amount),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
