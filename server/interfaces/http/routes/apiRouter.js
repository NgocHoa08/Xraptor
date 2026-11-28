import express from 'express';
import { PERMISSIONS } from '../../../domain/rbac/permissions.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function createApiRouter({
  config,
  gatewayCapabilities,
  authMiddlewares,
  uploadMiddleware,
  controllers,
}) {
  const router = express.Router();
  const { authenticate, requirePermission } = authMiddlewares;
  const { auth, users, products, orders, payments, content } = controllers;

  // ======================== HEALTH ========================
  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'xraptor-api',
      architecture: 'clean-architecture',
      database: config.dbMode,
      paymentGatewayMode: gatewayCapabilities.vnpayMode,
      timestamp: new Date().toISOString(),
    });
  });

  // ======================== AUTH ========================
  router.post('/auth/login', asyncHandler(auth.login));
  router.get('/auth/me', authenticate, asyncHandler(auth.me));
  router.post('/auth/change-password', authenticate, asyncHandler(auth.changePassword));

  // ======================== USERS & RBAC ========================
  router.get(
    '/users/roles',
    authenticate,
    requirePermission(PERMISSIONS.USERS_READ),
    asyncHandler(users.roles)
  );
  router.get(
    '/users',
    authenticate,
    requirePermission(PERMISSIONS.USERS_READ),
    asyncHandler(users.list)
  );
  router.post(
    '/users',
    authenticate,
    requirePermission(PERMISSIONS.USERS_WRITE),
    asyncHandler(users.create)
  );
  router.patch(
    '/users/:id',
    authenticate,
    requirePermission(PERMISSIONS.USERS_WRITE),
    asyncHandler(users.update)
  );
  router.delete(
    '/users/:id',
    authenticate,
    requirePermission(PERMISSIONS.USERS_DELETE),
    asyncHandler(users.delete)
  );

  // ======================== DASHBOARD & MEDIA ========================
  router.get(
    '/dashboard',
    authenticate,
    requirePermission(PERMISSIONS.DASHBOARD_READ),
    asyncHandler(content.getDashboard)
  );
  router.post(
    '/upload',
    authenticate,
    requirePermission(PERMISSIONS.MEDIA_UPLOAD),
    uploadMiddleware.single('image'),
    asyncHandler(content.uploadImage)
  );

  // ======================== PRODUCTS ========================
  router.get('/products', asyncHandler(products.list));
  router.get('/products/:id', asyncHandler(products.getById));
  router.post(
    '/products',
    authenticate,
    requirePermission(PERMISSIONS.PRODUCTS_WRITE),
    asyncHandler(products.create)
  );
  router.put(
    '/products/:id',
    authenticate,
    requirePermission(PERMISSIONS.PRODUCTS_WRITE),
    asyncHandler(products.update)
  );
  router.delete(
    '/products/:id',
    authenticate,
    requirePermission(PERMISSIONS.PRODUCTS_DELETE),
    asyncHandler(products.delete)
  );

  // ======================== ORDERS ========================
  router.post('/orders', asyncHandler(orders.create));
  router.get('/orders/track/:query', asyncHandler(orders.track));
  router.get(
    '/orders',
    authenticate,
    requirePermission(PERMISSIONS.ORDERS_READ),
    asyncHandler(orders.list)
  );
  router.patch(
    '/orders/:id/status',
    authenticate,
    requirePermission(PERMISSIONS.ORDERS_UPDATE),
    asyncHandler(orders.updateStatus)
  );
  router.delete(
    '/orders/:id',
    authenticate,
    requirePermission(PERMISSIONS.ORDERS_DELETE),
    asyncHandler(orders.delete)
  );

  // ======================== PAYMENTS ========================
  router.get('/payments/methods', asyncHandler(payments.methods));
  router.post('/payments/create', asyncHandler(payments.createIntent));
  router.get('/payments/order/:orderCode', asyncHandler(payments.getByOrder));
  router.get('/payments/vnpay/return', asyncHandler(payments.vnpayReturn));
  router.get('/payments/vnpay/ipn', asyncHandler(payments.vnpayIpn));
  router.post('/payments/sandbox/confirm', asyncHandler(payments.sandboxConfirm));
  router.get(
    '/payments',
    authenticate,
    requirePermission(PERMISSIONS.PAYMENTS_READ),
    asyncHandler(payments.list)
  );
  router.post(
    '/payments/:id/confirm',
    authenticate,
    requirePermission(PERMISSIONS.PAYMENTS_VERIFY),
    asyncHandler(payments.confirmManual)
  );
  router.post(
    '/payments/:id/refund',
    authenticate,
    requirePermission(PERMISSIONS.PAYMENTS_REFUND),
    asyncHandler(payments.refund)
  );

  // ======================== CONTACTS ========================
  router.post('/contacts', asyncHandler(content.createContact));
  router.get(
    '/contacts',
    authenticate,
    requirePermission(PERMISSIONS.CONTACTS_READ),
    asyncHandler(content.listContacts)
  );
  router.patch(
    '/contacts/:id',
    authenticate,
    requirePermission(PERMISSIONS.CONTACTS_UPDATE),
    asyncHandler(content.updateContactStatus)
  );
  router.delete(
    '/contacts/:id',
    authenticate,
    requirePermission(PERMISSIONS.CONTACTS_DELETE),
    asyncHandler(content.deleteContact)
  );

  // ======================== SUBSCRIBERS ========================
  router.post('/subscribers', asyncHandler(content.createSubscriber));
  router.get(
    '/subscribers',
    authenticate,
    requirePermission(PERMISSIONS.SUBSCRIBERS_READ),
    asyncHandler(content.listSubscribers)
  );
  router.delete(
    '/subscribers/:id',
    authenticate,
    requirePermission(PERMISSIONS.SUBSCRIBERS_DELETE),
    asyncHandler(content.deleteSubscriber)
  );

  // ======================== BLOGS ========================
  router.get('/blogs', asyncHandler(content.listBlogs));
  router.post(
    '/blogs',
    authenticate,
    requirePermission(PERMISSIONS.BLOGS_WRITE),
    asyncHandler(content.createBlog)
  );
  router.put(
    '/blogs/:id',
    authenticate,
    requirePermission(PERMISSIONS.BLOGS_WRITE),
    asyncHandler(content.updateBlog)
  );
  router.delete(
    '/blogs/:id',
    authenticate,
    requirePermission(PERMISSIONS.BLOGS_DELETE),
    asyncHandler(content.deleteBlog)
  );

  return router;
}
