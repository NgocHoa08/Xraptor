import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL?.trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const vnpayTmnCode = process.env.VNPAY_TMN_CODE?.trim() || '';
const vnpayHashSecret = process.env.VNPAY_HASH_SECRET?.trim() || '';

export function loadConfig(overrides = {}) {
  const useSupabase =
    overrides.useSupabase !== undefined
      ? Boolean(overrides.useSupabase)
      : Boolean(supabaseUrl && supabaseKey);

  const port = Number(overrides.port ?? process.env.PORT ?? 4000);
  const apiBaseUrl = (
    overrides.apiBaseUrl ??
    process.env.API_BASE_URL ??
    `http://localhost:${port}`
  ).replace(/\/+$/, '');
  const appBaseUrl = (
    overrides.appBaseUrl ??
    process.env.APP_BASE_URL ??
    'http://localhost:5173'
  ).replace(/\/+$/, '');

  return {
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
    isVercel: Boolean(process.env.VERCEL),
    useSupabase,
    dbMode: useSupabase ? 'supabase' : 'sqlite',
    sqlitePath: overrides.sqlitePath || null,
    supabase: {
      url: supabaseUrl || '',
      serviceRoleKey: supabaseKey || '',
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'xraptor-uploads',
    },
    security: {
      tokenSecret: process.env.ADMIN_JWT_SECRET || 'xraptor-pickleball-secret-key-2026',
      paymentSigningSecret:
        process.env.PAYMENT_SIGNING_SECRET ||
        process.env.ADMIN_JWT_SECRET ||
        'xraptor-payment-signing-secret-2026',
    },
    urls: {
      appBaseUrl,
      apiBaseUrl,
    },
    vietqr: {
      bankCode: process.env.VIETQR_BANK_CODE?.trim() || 'MB',
      bankName: process.env.VIETQR_BANK_NAME?.trim() || 'MB Bank (Ngân hàng Quân Đội)',
      accountNo: process.env.VIETQR_ACCOUNT_NO?.trim() || '0949331386',
      accountName: process.env.VIETQR_ACCOUNT_NAME?.trim() || 'XRAPTOR PICKLEBALL VIETNAM',
    },
    vnpay: {
      tmnCode: overrides.vnpayTmnCode ?? vnpayTmnCode,
      hashSecret: overrides.vnpayHashSecret ?? vnpayHashSecret,
      paymentUrl:
        process.env.VNPAY_URL?.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl:
        process.env.VNPAY_RETURN_URL?.trim() || `${apiBaseUrl}/api/payments/vnpay/return`,
    },
  };
}
