import { PAYMENT_STATUSES } from '../../domain/entities/Payment.js';
import { assertPermission, PERMISSIONS } from '../../domain/rbac/permissions.js';

export class GetDashboardUseCase {
  constructor({
    dbMode,
    orderRepository,
    productRepository,
    paymentRepository,
    contactRepository,
    subscriberRepository,
    adminRepository,
  }) {
    this.dbMode = dbMode;
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.paymentRepository = paymentRepository;
    this.contactRepository = contactRepository;
    this.subscriberRepository = subscriberRepository;
    this.adminRepository = adminRepository;
  }

  async execute(actor) {
    assertPermission(actor, PERMISSIONS.DASHBOARD_READ);

    const [orders, products, payments, contacts, subscribers, admins] = await Promise.all([
      this.orderRepository.findAll(),
      this.productRepository.findAll(),
      this.paymentRepository.findAll(),
      this.contactRepository.findAll(),
      this.subscriberRepository.findAll(),
      this.adminRepository.findAll(),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status !== 'Đã hủy')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const paidRevenue = payments
      .filter((p) => p.status === PAYMENT_STATUSES.PAID)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'Chờ xác nhận').length;
    const completedOrders = orders.filter((o) => o.status === 'Hoàn thành').length;
    const paidOrders = orders.filter((o) => o.payment_status === PAYMENT_STATUSES.PAID).length;
    const unreadContacts = contacts.filter((c) => c.status === 'Chưa xử lý').length;

    const catMap = new Map();
    for (const p of products) {
      const entry = catMap.get(p.category) || {
        category: p.category,
        productCount: 0,
        totalStock: 0,
      };
      entry.productCount += 1;
      entry.totalStock += Number(p.stock || 0);
      catMap.set(p.category, entry);
    }

    const lowStockProducts = [...products]
      .filter((p) => Number(p.stock) <= 15)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);

    return {
      database: this.dbMode,
      kpis: {
        totalRevenue,
        paidRevenue,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        paidOrders,
        totalProducts: products.length,
        lowStockCount: products.filter((p) => Number(p.stock) <= 10).length,
        unreadContacts,
        totalSubscribers: subscribers.length,
        totalStaff: admins.length,
        activeStaff: admins.filter((a) => a.isActive).length,
      },
      byCategory: [...catMap.values()],
      recentOrders: orders.slice(0, 6),
      lowStockProducts,
    };
  }
}
