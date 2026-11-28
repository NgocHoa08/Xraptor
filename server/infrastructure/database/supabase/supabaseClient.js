import { createClient } from '@supabase/supabase-js';
import {
  SEED_ADMINS,
  SEED_BLOGS,
  SEED_CONTACTS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_SUBSCRIBERS,
} from '../seedData.js';
import {
  generateTransactionCode,
  normalizePaymentMethod,
  PAYMENT_STATUSES,
} from '../../../domain/entities/Payment.js';

export function createSupabaseContext({ url, serviceRoleKey, passwordHasher, vietqr }) {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let seededPromise = null;

  async function ensureSeeded() {
    if (seededPromise) return seededPromise;
    seededPromise = (async () => {
      const { count: adminCount, error: adminErr } = await supabase
        .from('admins')
        .select('id', { count: 'exact', head: true });

      if (adminErr) {
        seededPromise = null;
        throw new Error(
          `Chưa tạo bảng trên Supabase (${adminErr.message}). Hãy chạy file supabase/schema.sql trong Supabase SQL Editor.`
        );
      }

      if (!adminCount) {
        await supabase.from('admins').upsert(
          SEED_ADMINS.map((a) => ({
            email: a.email,
            name: a.name,
            password_hash: passwordHasher.hash(a.password),
            role: a.role,
            is_active: a.isActive,
          })),
          { onConflict: 'email' }
        );
      }

      const { count: prodCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      if (!prodCount) {
        await supabase.from('products').insert(
          SEED_PRODUCTS.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            old_price: p.old_price || 0,
            stock: p.stock || 0,
            category: p.category,
            sub_category: p.sub_category || '',
            featured: Boolean(p.featured),
            image: p.image,
            gallery: p.gallery || [p.image],
            specs: p.specs || '',
            description: p.description || '',
          }))
        );
      }

      const { count: blogCount } = await supabase
        .from('blogs')
        .select('id', { count: 'exact', head: true });
      if (!blogCount) {
        await supabase.from('blogs').insert(SEED_BLOGS);
      }

      const { count: orderCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });
      if (!orderCount) {
        for (const o of SEED_ORDERS) {
          const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
          const method = normalizePaymentMethod(o.payment_method);
          const isPaid = o.status === 'Hoàn thành' || o.status === 'Đang giao';
          const payStatus = isPaid
            ? PAYMENT_STATUSES.PAID
            : method === 'COD'
              ? PAYMENT_STATUSES.UNPAID
              : PAYMENT_STATUSES.PENDING;
          const paidAt = isPaid ? new Date().toISOString() : null;

          const { data: ord } = await supabase
            .from('orders')
            .insert({
              order_code: o.order_code,
              customer_name: o.customer_name,
              phone: o.phone,
              email: o.email,
              address: o.address,
              note: o.note,
              payment_method: method,
              payment_status: payStatus,
              total_amount: total,
              status: o.status,
              paid_at: paidAt,
            })
            .select()
            .single();

          if (ord) {
            await supabase.from('order_items').insert(
              o.items.map((item) => ({
                order_id: ord.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_image: item.product_image,
                price: item.price,
                qty: item.qty,
              }))
            );

            const transferContent = `XRAPTOR ${ord.order_code}`;
            const qrUrl =
              method === 'VIETQR' && vietqr
                ? `https://img.vietqr.io/image/${encodeURIComponent(vietqr.bankCode)}-${encodeURIComponent(
                    vietqr.accountNo
                  )}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(
                    transferContent
                  )}&accountName=${encodeURIComponent(vietqr.accountName)}`
                : '';
            const bankInfo =
              method === 'VIETQR' && vietqr ? { ...vietqr, transferContent, amount: total } : {};

            await supabase.from('payments').insert({
              transaction_code: generateTransactionCode(ord.order_code),
              order_id: ord.id,
              order_code: ord.order_code,
              provider: method,
              method,
              amount: total,
              status: payStatus,
              gateway_txn_no: isPaid ? `SEED-${ord.order_code}` : '',
              qr_url: qrUrl,
              bank_info: bankInfo,
              confirmed_by: isPaid ? 'admin@xraptor.vn' : '',
              paid_at: paidAt,
            });
          }
        }
      }

      const { count: contactCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });
      if (!contactCount) {
        await supabase.from('contacts').insert(SEED_CONTACTS);
      }

      const { count: subCount } = await supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true });
      if (!subCount) {
        await supabase
          .from('subscribers')
          .upsert(
            SEED_SUBSCRIBERS.map((email) => ({ email })),
            { onConflict: 'email' }
          );
      }
    })();

    return seededPromise;
  }

  return { supabase, ensureSeeded };
}
