import {
  assertValidOrderStatus,
  generateOrderCode,
  validateCreateOrderInput,
} from '../../domain/entities/Order.js';
import {
  generateTransactionCode,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../../domain/entities/Payment.js';
import { NotFoundError } from '../../domain/errors/AppError.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class CreateOrderUseCase {
  constructor({ productRepository, orderRepository, paymentRepository, paymentGatewayFactory }) {
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
    this.paymentGatewayFactory = paymentGatewayFactory;
  }

  async execute(body, context = {}) {
    const input = validateCreateOrderInput(body);

    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of input.items) {
      const dbProd = item.productId
        ? await this.productRepository.findById(item.productId)
        : null;
      const price = dbProd ? dbProd.price : item.price;
      const name = dbProd ? dbProd.name : item.name;
      const image = dbProd ? dbProd.image : item.image;
      totalAmount += price * item.qty;

      verifiedItems.push({
        productId: dbProd ? dbProd.id : String(item.productId || 'custom'),
        productName: name,
        productImage: image,
        price,
        qty: item.qty,
        hasDbProd: Boolean(dbProd),
      });
    }

    const orderCode = generateOrderCode();
    const initialPaymentStatus =
      input.paymentMethod === PAYMENT_METHODS.COD
        ? PAYMENT_STATUSES.UNPAID
        : PAYMENT_STATUSES.PENDING;

    const order = await this.orderRepository.create({
      orderCode,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      note: input.note,
      paymentMethod: input.paymentMethod,
      paymentStatus: initialPaymentStatus,
      totalAmount,
      status: 'Chờ xác nhận',
      items: verifiedItems,
    });

    // Deduct stock for catalog products
    for (const vi of verifiedItems) {
      if (vi.hasDbProd) {
        await this.productRepository.decrementStock(vi.productId, vi.qty);
      }
    }

    // Initialize payment via PaymentGatewayFactory
    const transactionCode = generateTransactionCode(order.order_code);
    const gatewayResult = await this.paymentGatewayFactory.createPayment({
      method: input.paymentMethod,
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
      method: input.paymentMethod,
      amount: order.total_amount,
      status: gatewayResult.status,
      paymentUrl: gatewayResult.paymentUrl || '',
      qrUrl: gatewayResult.qrUrl || '',
      bankInfo: gatewayResult.bankInfo || {},
      metadata: gatewayResult.metadata || {},
    });

    return {
      order: { ...order, payment },
      payment,
    };
  }
}

export class TrackOrdersUseCase {
  constructor({ orderRepository, paymentRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(query) {
    const orders = await this.orderRepository.track(query);
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const payment = await this.paymentRepository.findLatestByOrderId(order.id);
        return payment ? { ...order, payment } : order;
      })
    );
    return { orders: enriched };
  }
}

export class ListOrdersUseCase {
  constructor({ orderRepository, paymentRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(actor, filters = {}) {
    assertPermission(actor, PERMISSIONS.ORDERS_READ);
    const orders = await this.orderRepository.findAll(filters);
    const payments = await this.paymentRepository.findAll();
    const latestByOrder = new Map();
    for (const p of payments) {
      if (!latestByOrder.has(p.orderId)) {
        latestByOrder.set(p.orderId, p);
      }
    }
    return {
      orders: orders.map((o) => ({
        ...o,
        payment: latestByOrder.get(o.id) || null,
      })),
    };
  }
}

export class UpdateOrderStatusUseCase {
  constructor({ orderRepository, paymentRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  async execute(actor, id, status) {
    assertPermission(actor, PERMISSIONS.ORDERS_UPDATE);
    assertValidOrderStatus(status);

    const updated = await this.orderRepository.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Không tìm thấy đơn hàng.');
    }

    // Auto-confirm COD payment when order is marked Completed
    let latestPayment = await this.paymentRepository.findLatestByOrderId(updated.id);
    if (
      status === 'Hoàn thành' &&
      updated.payment_method === PAYMENT_METHODS.COD &&
      updated.payment_status !== PAYMENT_STATUSES.PAID
    ) {
      const paidAt = new Date().toISOString();
      if (latestPayment) {
        latestPayment = await this.paymentRepository.markPaid(latestPayment.id, {
          gatewayTxnNo: `COD-${updated.order_code}`,
          confirmedBy: actor.email,
          paidAt,
        });
      }
      const syncedOrder = await this.orderRepository.updatePaymentStatus(
        updated.id,
        PAYMENT_STATUSES.PAID,
        paidAt
      );
      return { order: { ...syncedOrder, payment: latestPayment } };
    }

    return { order: { ...updated, payment: latestPayment } };
  }
}

export class DeleteOrderUseCase {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(actor, id) {
    assertPermission(actor, PERMISSIONS.ORDERS_DELETE);
    const deleted = await this.orderRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy đơn hàng.');
    }
    return { ok: true };
  }
}
