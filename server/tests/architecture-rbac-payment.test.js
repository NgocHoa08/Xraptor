import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContainer } from '../container.js';
import { createExpressApp } from '../interfaces/http/createExpressApp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

function collectJsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectJsFiles(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

async function startTestServer(overrides = {}) {
  const container = createContainer({
    useSupabase: false,
    sqlitePath: ':memory:',
    ...overrides,
  });
  const app = createExpressApp(container);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  async function api(urlPath, { method = 'GET', token = '', body } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${urlPath}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  async function loginAs(email, password) {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(res.status, 200, `Login failed for ${email}: ${JSON.stringify(res.data)}`);
    return res.data;
  }

  return {
    container,
    baseUrl,
    api,
    loginAs,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('Clean Architecture dependency rule: domain & application layers have zero outer-layer imports', () => {
  const domainFiles = collectJsFiles(path.join(serverRoot, 'domain'));
  assert.ok(domainFiles.length >= 6, 'Expected domain files');
  for (const file of domainFiles) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      src,
      /from\s+['"](express|multer|cors|@supabase\/supabase-js|node:sqlite|\.\.\/.*(application|infrastructure|interfaces))/,
      `Domain file violates dependency rule: ${file}`
    );
  }

  const appFiles = collectJsFiles(path.join(serverRoot, 'application'));
  assert.ok(appFiles.length >= 8, 'Expected application use case files');
  for (const file of appFiles) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      src,
      /from\s+['"](express|multer|cors|@supabase\/supabase-js|node:sqlite|\.\.\/.*(infrastructure|interfaces))/,
      `Application file violates dependency rule: ${file}`
    );
  }
});

test('RBAC: enforces granular permissions across superadmin, manager, staff, editor & live lock', async () => {
  const env = await startTestServer();
  try {
    const health = await env.api('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.architecture, 'clean-architecture');
    assert.equal(health.data.database, 'sqlite');

    const superadmin = await env.loginAs('admin@xraptor.vn', 'admin123');
    const manager = await env.loginAs('manager@xraptor.vn', 'manager123');
    const staff = await env.loginAs('staff@xraptor.vn', 'staff123');
    const editor = await env.loginAs('editor@xraptor.vn', 'editor123');

    assert.equal(superadmin.admin.role, 'superadmin');
    assert.ok(superadmin.admin.permissions.includes('users:write'));
    assert.equal(manager.admin.role, 'manager');
    assert.ok(!manager.admin.permissions.includes('users:read'));
    assert.equal(staff.admin.role, 'staff');
    assert.ok(staff.admin.permissions.includes('payments:verify'));
    assert.ok(!staff.admin.permissions.includes('payments:refund'));
    assert.equal(editor.admin.role, 'editor');
    assert.ok(editor.admin.permissions.includes('blogs:write'));
    assert.ok(!editor.admin.permissions.includes('orders:read'));

    // Manager CANNOT access users or delete orders
    assert.equal((await env.api('/api/users', { token: manager.token })).status, 403);
    assert.equal(
      (await env.api('/api/orders/1', { method: 'DELETE', token: manager.token })).status,
      403
    );

    // Manager CAN create a product
    const createdProd = await env.api('/api/products', {
      method: 'POST',
      token: manager.token,
      body: {
        sku: 'XR-TEST-01',
        name: 'Vợt Test Clean Architecture',
        price: 3900000,
        stock: 20,
        category: 'Vợt Pickleball',
        image: '/images/test.webp',
      },
    });
    assert.equal(createdProd.status, 201);

    // Staff CANNOT create products or blogs
    assert.equal(
      (
        await env.api('/api/products', {
          method: 'POST',
          token: staff.token,
          body: {
            sku: 'XR-FAIL',
            name: 'Fail',
            price: 1000,
            category: 'Vợt Pickleball',
            image: '/x.webp',
          },
        })
      ).status,
      403
    );
    assert.equal(
      (
        await env.api('/api/blogs', {
          method: 'POST',
          token: staff.token,
          body: { title: 'Test', image: '/x.webp' },
        })
      ).status,
      403
    );

    // Editor CAN create blog, CANNOT read orders or payments
    const createdBlog = await env.api('/api/blogs', {
      method: 'POST',
      token: editor.token,
      body: { title: 'Bài viết test từ Editor', image: '/images/blog.webp', tag: 'Kỹ thuật' },
    });
    assert.equal(createdBlog.status, 201);
    assert.equal((await env.api('/api/orders', { token: editor.token })).status, 403);
    assert.equal((await env.api('/api/payments', { token: editor.token })).status, 403);

    // Superadmin creates new staff user, logs in, then locks account -> immediate token revocation
    const newUserRes = await env.api('/api/users', {
      method: 'POST',
      token: superadmin.token,
      body: {
        name: 'Nhân viên mới',
        email: 'newstaff@xraptor.vn',
        password: 'password123',
        role: 'staff',
      },
    });
    assert.equal(newUserRes.status, 201);
    const newUserId = newUserRes.data.user.id;

    const newStaffLogin = await env.loginAs('newstaff@xraptor.vn', 'password123');
    assert.equal((await env.api('/api/auth/me', { token: newStaffLogin.token })).status, 200);

    // Lock the account
    const lockRes = await env.api(`/api/users/${newUserId}`, {
      method: 'PATCH',
      token: superadmin.token,
      body: { isActive: false },
    });
    assert.equal(lockRes.status, 200);
    assert.equal(lockRes.data.user.isActive, false);

    // Existing token is immediately rejected
    assert.equal((await env.api('/api/auth/me', { token: newStaffLogin.token })).status, 403);

    // Superadmin cannot delete self
    assert.equal(
      (
        await env.api(`/api/users/${superadmin.admin.id}`, {
          method: 'DELETE',
          token: superadmin.token,
        })
      ).status,
      403
    );

    // Superadmin can delete created test user
    assert.equal(
      (await env.api(`/api/users/${newUserId}`, { method: 'DELETE', token: superadmin.token }))
        .status,
      200
    );
  } finally {
    await env.close();
  }
});

test('Payment flows: COD auto-sync, VietQR manual confirm, VNPay Sandbox HMAC, Refund RBAC', async () => {
  const env = await startTestServer();
  try {
    const staff = await env.loginAs('staff@xraptor.vn', 'staff123');
    const manager = await env.loginAs('manager@xraptor.vn', 'manager123');

    // 1. Public payment methods
    const methodsRes = await env.api('/api/payments/methods');
    assert.equal(methodsRes.status, 200);
    assert.equal(methodsRes.data.methods.length, 3);

    // 2. COD order -> auto-marks paid when Staff sets status to Hoàn thành
    const codOrderRes = await env.api('/api/orders', {
      method: 'POST',
      body: {
        customerName: 'Khách COD',
        phone: '0911111111',
        address: 'Hà Nội',
        paymentMethod: 'COD',
        items: [{ productId: 'p-1', qty: 1 }],
      },
    });
    assert.equal(codOrderRes.status, 201);
    assert.equal(codOrderRes.data.order.payment_status, 'Chưa thanh toán');
    assert.equal(codOrderRes.data.payment.provider, 'COD');

    const completeCod = await env.api(`/api/orders/${codOrderRes.data.order.id}/status`, {
      method: 'PATCH',
      token: staff.token,
      body: { status: 'Hoàn thành' },
    });
    assert.equal(completeCod.status, 200);
    assert.equal(completeCod.data.order.payment_status, 'Đã thanh toán');

    // 3. VietQR order (also accepts legacy 'Chuyển khoản')
    const qrOrderRes = await env.api('/api/orders', {
      method: 'POST',
      body: {
        customerName: 'Khách VietQR',
        phone: '0922222222',
        address: 'TP HCM',
        paymentMethod: 'Chuyển khoản',
        items: [{ productId: 'b-1', qty: 2 }],
      },
    });
    assert.equal(qrOrderRes.status, 201);
    assert.equal(qrOrderRes.data.order.payment_method, 'VIETQR');
    assert.equal(qrOrderRes.data.order.payment_status, 'Đang chờ thanh toán');
    assert.ok(qrOrderRes.data.payment.qrUrl.includes('img.vietqr.io'));
    assert.ok(
      qrOrderRes.data.payment.bankInfo.transferContent.includes(qrOrderRes.data.order.order_code)
    );

    // Staff verifies VietQR payment -> order advances to Đang xử lý
    const confirmQr = await env.api(`/api/payments/${qrOrderRes.data.payment.id}/confirm`, {
      method: 'POST',
      token: staff.token,
      body: { gatewayTxnNo: 'FT261128999' },
    });
    assert.equal(confirmQr.status, 200);
    assert.equal(confirmQr.data.payment.status, 'Đã thanh toán');
    assert.equal(confirmQr.data.order.status, 'Đang xử lý');

    // 4. VNPay Sandbox flow: reject tampered signature, allow failure + retry + success + refund
    const vnpOrderRes = await env.api('/api/orders', {
      method: 'POST',
      body: {
        customerName: 'Khách VNPay',
        phone: '0933333333',
        address: 'Đà Nẵng',
        paymentMethod: 'VNPAY',
        items: [{ productId: 'p-2', qty: 1 }],
      },
    });
    assert.equal(vnpOrderRes.status, 201);
    const p1 = vnpOrderRes.data.payment;
    assert.equal(p1.provider, 'SANDBOX');
    assert.ok(p1.metadata.sandboxSignature);

    // Tampered signature rejected
    const badSig = await env.api('/api/payments/sandbox/confirm', {
      method: 'POST',
      body: {
        transactionCode: p1.transactionCode,
        signature: 'forged-signature',
        outcome: 'success',
      },
    });
    assert.equal(badSig.status, 400);

    // Customer cancels first attempt -> Thất bại
    const failAttempt = await env.api('/api/payments/sandbox/confirm', {
      method: 'POST',
      body: {
        transactionCode: p1.transactionCode,
        signature: p1.metadata.sandboxSignature,
        outcome: 'failed',
      },
    });
    assert.equal(failAttempt.status, 200);
    assert.equal(failAttempt.data.payment.status, 'Thất bại');

    // Retry creates new payment intent
    const retryRes = await env.api('/api/payments/create', {
      method: 'POST',
      body: { orderCode: vnpOrderRes.data.order.order_code, method: 'VNPAY' },
    });
    assert.equal(retryRes.status, 201);
    const p2 = retryRes.data.payment;

    // Succeed on second attempt
    const okAttempt = await env.api('/api/payments/sandbox/confirm', {
      method: 'POST',
      body: {
        transactionCode: p2.transactionCode,
        signature: p2.metadata.sandboxSignature,
        outcome: 'success',
        bankCode: 'NCB',
      },
    });
    assert.equal(okAttempt.status, 200);
    assert.equal(okAttempt.data.payment.status, 'Đã thanh toán');
    assert.equal(okAttempt.data.order.payment_status, 'Đã thanh toán');
    assert.equal(okAttempt.data.order.status, 'Đang xử lý');

    // Refund RBAC: Staff gets 403, Manager succeeds, double refund returns 409
    assert.equal(
      (
        await env.api(`/api/payments/${p2.id}/refund`, {
          method: 'POST',
          token: staff.token,
          body: { reason: 'Test' },
        })
      ).status,
      403
    );

    const refundOk = await env.api(`/api/payments/${p2.id}/refund`, {
      method: 'POST',
      token: manager.token,
      body: { reason: 'Khách đổi mẫu vợt' },
    });
    assert.equal(refundOk.status, 200);
    assert.equal(refundOk.data.payment.status, 'Đã hoàn tiền');
    assert.equal(refundOk.data.order.payment_status, 'Đã hoàn tiền');

    const doubleRefund = await env.api(`/api/payments/${p2.id}/refund`, {
      method: 'POST',
      token: manager.token,
    });
    assert.equal(doubleRefund.status, 409);
  } finally {
    await env.close();
  }
});

test('VNPay v2.1.0 live gateway HMAC-SHA512 signing & IPN webhook verification', async () => {
  const env = await startTestServer({
    vnpayTmnCode: 'XRAPTOR01',
    vnpayHashSecret: 'SUPERSECRETVNPAYHASHKEY2026',
  });
  try {
    const orderRes = await env.api('/api/orders', {
      method: 'POST',
      body: {
        customerName: 'Khách VNPay Live',
        phone: '0944444444',
        address: 'Ninh Bình',
        paymentMethod: 'VNPAY',
        items: [{ productId: 'b-2', qty: 1 }],
      },
    });
    assert.equal(orderRes.status, 201);
    const payment = orderRes.data.payment;
    assert.equal(payment.provider, 'VNPAY');
    assert.ok(payment.paymentUrl.includes('vnp_SecureHash='));

    // Build a valid signed VNPay IPN callback using the same gateway secret
    const urlObj = new URL(payment.paymentUrl);
    const params = Object.fromEntries(urlObj.searchParams.entries());
    const callbackParams = {
      vnp_TmnCode: params.vnp_TmnCode,
      vnp_Amount: params.vnp_Amount,
      vnp_BankCode: 'NCB',
      vnp_OrderInfo: params.vnp_OrderInfo,
      vnp_ResponseCode: '00',
      vnp_TransactionNo: '14998877',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: payment.transactionCode,
    };

    // Re-sign callbackParams with HMAC-SHA512
    const crypto = await import('node:crypto');
    const sortedEntries = Object.keys(callbackParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(callbackParams[k]).replace(/%20/g, '+')}`);
    const signData = sortedEntries.join('&');
    const hash = crypto
      .createHmac('sha512', 'SUPERSECRETVNPAYHASHKEY2026')
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Invalid checksum -> RspCode 97
    const badIpn = await env.api(`/api/payments/vnpay/ipn?${signData}&vnp_SecureHash=deadbeef`);
    assert.equal(badIpn.status, 200);
    assert.equal(badIpn.data.RspCode, '97');

    // Valid IPN -> RspCode 00
    const goodIpn = await env.api(`/api/payments/vnpay/ipn?${signData}&vnp_SecureHash=${hash}`);
    assert.equal(goodIpn.status, 200);
    assert.equal(goodIpn.data.RspCode, '00');

    // Replay IPN -> idempotent RspCode 02
    const replayIpn = await env.api(`/api/payments/vnpay/ipn?${signData}&vnp_SecureHash=${hash}`);
    assert.equal(replayIpn.status, 200);
    assert.equal(replayIpn.data.RspCode, '02');

    // Verify order payment status updated
    const orderPay = await env.api(`/api/payments/order/${orderRes.data.order.order_code}`);
    assert.equal(orderPay.status, 200);
    assert.equal(orderPay.data.order.payment_status, 'Đã thanh toán');
    assert.equal(orderPay.data.payment.gatewayTxnNo, '14998877');
  } finally {
    await env.close();
  }
});
