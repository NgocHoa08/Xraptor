import {
  assertCanConfirmPayment,
  assertCanRefundPayment,
  generateTransactionCode,
  normalizePaymentMethod,
  PAYMENT_METHOD_META,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../../domain/entities/Payment.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors/AppError.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class ListPaymentMethodsUseCase {
  constructor({ paymentGatewayFactory }) {
    this.paymentGatewayFactory = paymentGatewayFactory;
  }

  async execute() {
    const gatewayInfo = this.paymentGatewayFactory.getCapabilities();
    return {
      gatewayMode: gatewayInfo.vnpayMode,
      methods: [
        { ...PAYMENT_METHOD_META[PAYMENT_METHODS.COD], enabled: true },
        {
          ...PAYMENT_METHOD_META[PAYMENT_METHODS.VIETQR],
          enabled: true,
          bankName: gatewayInfo.bankName,
        },
        {
          ...PAYMENT_METHOD_META[PAYMENT_METHODS.VNPAY],
          enabled: true,
          mode: gatewayInfo.vnpayMode,
        },
      ],
    };
  }
}

export class CreatePaymentIntentUseCase {
  constructor({ orderRepository, paymentRepository, paymentGatewayFactory }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
    this.paymentGatewayFactory = paymentGatewayFactory;
  }

  async execute({ orderCode, method }, context = {}) {
    if (!orderCode) {
      throw new ValidationError('Vui lòng cung cấp mã đơn hàng.');
    }
    const order = await this.orderRepository.findByOrderCode(String(orderCode).trim());
    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng.');
    }
    if (order.payment_status === PAYMENT_STATUSES.PAID) {
      throw new ConflictError('Đơn hàng này đã được thanh toán.');
    }
    if (order.status === 'Đã hủy') {
      throw new ConflictError('Không thể thanh toán cho đơn hàng đã hủy.');
    }

    const normalizedMethod = normalizePaymentMethod(method || order.payment_method);
    const transactionCode = generateTransactionCode(order.order_code);
    const gatewayResult = await this.paymentGatewayFactory.createPayment({
      method: normalizedMethod,
      orderCode: order.order_code,
      transactionCode,
      amount: order.total_amount,
      customerName: order.customer_name,
      clientIp: context.clientIp || '127.0.0.1',
    });

    const payment = await this.paymentRepository.create({
      transactionCode,
      orderId: order.id,
      orderCode: order.order_code,
      provider: gatewayResult.provider,
      method: normalizedMethod,
      amount: order.total_amount,
      status: gatewayResult.status,
      paymentUrl: gatewayResult.paymentUrl || '',
      qrUrl: gatewayResult.qrUrl || '',
      bankInfo: gatewayResult.bankInfo || {},
      metadata: gatewayResult.metadata || {},
    });

    await this.orderRepository.updatePaymentMethodAndStatus(
      order.id,
      normalizedMethod,
      gatewayResult.status
    );

    return { payment };
  }
}

export class GetOrderPaymentUseCase {
  constructor({ orderRepository, paymentRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(orderCode) {
    const order = await this.orderRepository.findByOrderCode(String(orderCode || '').trim());
    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng.');
    }
    const payment = await this.paymentRepository.findLatestByOrderId(order.id);
    return {
      order: {
        id: order.id,
        order_code: order.order_code,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        paid_at: order.paid_at,
      },
      payment,
    };
  }
}

export class ListPaymentsUseCase {
  constructor({ paymentRepository }) {
    this.paymentRepository = paymentRepository;
  }

  async execute(actor, filters = {}) {
    assertPermission(actor, PERMISSIONS.PAYMENTS_READ);
    const allPayments = await this.paymentRepository.findAll();
    const filtered = await this.paymentRepository.findAll(filters);

    const summary = {
      totalTransactions: allPayments.length,
      paidAmount: allPayments
        .filter((p) => p.status === PAYMENT_STATUSES.PAID)
        .reduce((s, p) => s + p.amount, 0),
      pendingAmount: allPayments
        .filter(
          (p) =>
            p.status === PAYMENT_STATUSES.PENDING || p.status === PAYMENT_STATUSES.UNPAID
        )
        .reduce((s, p) => s + p.amount, 0),
      refundedAmount: allPayments
        .filter((p) => p.status === PAYMENT_STATUSES.REFUNDED)
        .reduce((s, p) => s + p.amount, 0),
      paidCount: allPayments.filter((p) => p.status === PAYMENT_STATUSES.PAID).length,
      pendingCount: allPayments.filter(
        (p) => p.status === PAYMENT_STATUSES.PENDING || p.status === PAYMENT_STATUSES.UNPAID
      ).length,
    };

    return { payments: filtered, summary };
  }
}

export class HandleVnpayCallbackUseCase {
  constructor({ orderRepository, paymentRepository, paymentGatewayFactory }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
    this.paymentGatewayFactory = paymentGatewayFactory;
  }

  async execute(queryParams) {
    const verification = this.paymentGatewayFactory.verifyVnpayCallback(queryParams);
    if (!verification.validSignature) {
      return {
        rspCode: '97',
        message: 'Chữ ký VNPay không hợp lệ (Invalid Checksum).',
        success: false,
      };
    }

    const payment = await this.paymentRepository.findByTransactionCode(
      verification.transactionCode
    );
    if (!payment) {
      return {
        rspCode: '01',
        message: 'Không tìm thấy giao dịch.',
        success: false,
      };
    }

    if (payment.amount !== verification.amount) {
      return {
        rspCode: '04',
        message: 'Số tiền thanh toán không khớp.',
        success: false,
        orderCode: payment.orderCode,
      };
    }

    if (payment.status === PAYMENT_STATUSES.PAID) {
      return {
        rspCode: '02',
        message: 'Giao dịch đã được xác nhận trước đó.',
        success: true,
        orderCode: payment.orderCode,
        payment,
      };
    }

    if (verification.isSuccess) {
      const paidAt = new Date().toISOString();
      const updatedPayment = await this.paymentRepository.markPaid(payment.id, {
        gatewayTxnNo: verification.gatewayTxnNo,
        confirmedBy: 'VNPAY_GATEWAY',
        paidAt,
        metadata: { ...payment.metadata, vnpResponseCode: verification.responseCode },
      });
      await this.orderRepository.markOrderPaid(payment.orderId, paidAt);
      return {
        rspCode: '00',
        message: 'Thanh toán VNPay thành công.',
        success: true,
        orderCode: payment.orderCode,
        payment: updatedPayment,
      };
    }

    const failedPayment = await this.paymentRepository.markFailed(payment.id, {
      gatewayTxnNo: verification.gatewayTxnNo,
      metadata: { ...payment.metadata, vnpResponseCode: verification.responseCode },
    });
    await this.orderRepository.updatePaymentStatus(payment.orderId, PAYMENT_STATUSES.FAILED, null);
    return {
      rspCode: '00',
      message: 'Giao dịch VNPay không thành công hoặc đã bị hủy.',
      success: false,
      orderCode: payment.orderCode,
      payment: failedPayment,
    };
  }
}

export class HandleSandboxPaymentUseCase {
  constructor({ orderRepository, paymentRepository, paymentGatewayFactory }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
    this.paymentGatewayFactory = paymentGatewayFactory;
  }

  async execute({ transactionCode, signature, outcome = 'success', bankCode = 'NCB' } = {}) {
    if (!transactionCode || !signature) {
      throw new ValidationError('Thiếu mã giao dịch hoặc chữ ký xác thực.');
    }
    const payment = await this.paymentRepository.findByTransactionCode(String(transactionCode));
    if (!payment) {
      throw new NotFoundError('Không tìm thấy giao dịch thanh toán.');
    }

    const isValid = this.paymentGatewayFactory.verifySandboxSignature({
      transactionCode: payment.transactionCode,
      orderCode: payment.orderCode,
      amount: payment.amount,
      signature: String(signature),
    });
    if (!isValid) {
      throw new ValidationError('Chữ ký giao dịch không hợp lệ.');
    }

    if (payment.status === PAYMENT_STATUSES.PAID) {
      const order = await this.orderRepository.findById(payment.orderId);
      return { ok: true, payment, order };
    }

    if (outcome === 'success') {
      const paidAt = new Date().toISOString();
      const gatewayTxnNo = `VNP${Date.now().toString().slice(-8)}`;
      const updatedPayment = await this.paymentRepository.markPaid(payment.id, {
        gatewayTxnNo,
        confirmedBy: `VNPAY_SANDBOX (${bankCode})`,
        paidAt,
        metadata: { ...payment.metadata, bankCode, responseCode: '00' },
      });
      const order = await this.orderRepository.markOrderPaid(payment.orderId, paidAt);
      return { ok: true, payment: updatedPayment, order };
    }

    const failedPayment = await this.paymentRepository.markFailed(payment.id, {
      gatewayTxnNo: '',
      metadata: { ...payment.metadata, bankCode, responseCode: '24', reason: 'Khách hàng hủy giao dịch' },
    });
    const order = await this.orderRepository.updatePaymentStatus(
      payment.orderId,
      PAYMENT_STATUSES.FAILED,
      null
    );
    return { ok: false, payment: failedPayment, order };
  }
}

export class ConfirmManualPaymentUseCase {
  constructor({ orderRepository, paymentRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(actor, paymentId, { gatewayTxnNo = '', note = '' } = {}) {
    assertPermission(actor, PERMISSIONS.PAYMENTS_VERIFY);
    const payment = await this.paymentRepository.findById(Number(paymentId));
    if (!payment) {
      throw new NotFoundError('Không tìm thấy giao dịch thanh toán.');
    }
    assertCanConfirmPayment(payment);

    const paidAt = new Date().toISOString();
    const updatedPayment = await this.paymentRepository.markPaid(payment.id, {
      gatewayTxnNo: String(gatewayTxnNo || `MANUAL-${Date.now().toString().slice(-6)}`).trim(),
      confirmedBy: actor.email,
      paidAt,
      metadata: { ...payment.metadata, confirmNote: String(note || '').trim() },
    });
    const order = await this.orderRepository.markOrderPaid(payment.orderId, paidAt);
    return { payment: updatedPayment, order };
  }
}

export class RefundPaymentUseCase {
  constructor({ orderRepository, paymentRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(actor, paymentId, { reason = '' } = {}) {
    assertPermission(actor, PERMISSIONS.PAYMENTS_REFUND);
    const payment = await this.paymentRepository.findById(Number(paymentId));
    if (!payment) {
      throw new NotFoundError('Không tìm thấy giao dịch thanh toán.');
    }
    assertCanRefundPayment(payment);

    const refundedAt = new Date().toISOString();
    const updatedPayment = await this.paymentRepository.markRefunded(payment.id, {
      confirmedBy: actor.email,
      refundedAt,
      metadata: { ...payment.metadata, refundReason: String(reason || 'Hoàn tiền theo yêu cầu').trim() },
    });
    const order = await this.orderRepository.updatePaymentStatus(
      payment.orderId,
      PAYMENT_STATUSES.REFUNDED,
      payment.paidAt
    );
    return { payment: updatedPayment, order };
  }
}
