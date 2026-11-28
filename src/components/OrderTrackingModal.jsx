import React, { useState } from 'react';
import { X, Search, Package, Loader2, QrCode, CreditCard, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { formatVND } from '../data/siteData';

const STATUS_STYLE = {
  'Chờ xác nhận': 'bg-amber-100 text-amber-800',
  'Đang xử lý': 'bg-blue-100 text-blue-800',
  'Đang giao': 'bg-indigo-100 text-indigo-800',
  'Hoàn thành': 'bg-emerald-100 text-emerald-800',
  'Đã hủy': 'bg-red-100 text-red-800',
};

const PAY_STATUS_STYLE = {
  'Đã thanh toán': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Đang chờ thanh toán': 'bg-amber-50 text-amber-700 border-amber-200',
  'Chưa thanh toán': 'bg-gray-100 text-gray-600 border-gray-200',
  'Thất bại': 'bg-rose-50 text-rose-700 border-rose-200',
  'Đã hoàn tiền': 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function OrderTrackingModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [activeQrOrderId, setActiveQrOrderId] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState(null);

  if (!open) return null;

  const fetchOrders = async (searchText) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.trackOrders(searchText);
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await fetchOrders(query.trim());
  };

  const handleQuickPayOnline = async (order) => {
    setPayingOrderId(order.id);
    setError('');
    try {
      const intentRes = await api.createPaymentIntent({
        orderCode: order.order_code,
        method: 'VNPAY',
      });
      const p = intentRes.payment;
      if (p.paymentUrl) {
        window.location.href = p.paymentUrl;
        return;
      }
      await api.confirmSandboxPayment({
        transactionCode: p.transactionCode,
        signature: p.metadata?.sandboxSignature,
        outcome: 'success',
        bankCode: 'VNPAYQR',
      });
      await fetchOrders(query.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-xr-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-xr-fade"
      >
        <div className="px-5 py-4 bg-[#134377] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#f5dc4a]" />
            <h3 className="font-heading font-bold text-lg uppercase">Kiểm tra đơn hàng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleTrack} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập mã đơn (VD: XR-202601) hoặc SĐT..."
              className="flex-1 h-10 px-3.5 rounded border border-gray-300 text-sm outline-none focus:border-[#0972b6]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-10 rounded bg-[#0972b6] hover:bg-[#134377] text-white font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tra cứu</span>
            </button>
          </form>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {orders !== null && orders.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6 bg-[#f8f8f8] rounded-lg">
              Không tìm thấy đơn hàng nào khớp với “{query}”.
            </p>
          )}

          {orders && orders.length > 0 && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {orders.map((order) => {
                const canPay =
                  order.status !== 'Đã hủy' &&
                  order.payment_status !== 'Đã thanh toán' &&
                  order.payment_status !== 'Đã hoàn tiền';
                const showQr = activeQrOrderId === order.id && order.payment?.qrUrl;

                return (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-[#134377]">{order.order_code}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            PAY_STATUS_STYLE[order.payment_status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.payment_status || 'Chưa thanh toán'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.customer_name} • {order.phone} • {order.address}
                    </p>
                    <div className="bg-[#f8f8f8] rounded p-2.5 space-y-1.5">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="truncate pr-2">
                            {item.product_name} × {item.qty}
                          </span>
                          <span className="font-semibold shrink-0">
                            {formatVND(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold pt-1">
                      <span>Tổng cộng ({order.payment_method}):</span>
                      <span className="text-[#dd3333]">{formatVND(order.total_amount)}</span>
                    </div>

                    {order.payment_status === 'Đã thanh toán' && order.payment?.gatewayTxnNo && (
                      <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mã giao dịch: <strong className="font-mono">{order.payment.gatewayTxnNo}</strong>
                      </p>
                    )}

                    {canPay && (
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                        {order.payment?.qrUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveQrOrderId(showQr ? null : order.id)
                            }
                            className="px-3 h-8 rounded bg-[#edf8ff] text-[#134377] hover:bg-[#dceeff] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{showQr ? 'Ẩn mã VietQR' : 'Xem mã VietQR'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={payingOrderId === order.id}
                          onClick={() => handleQuickPayOnline(order)}
                          className="px-3 h-8 rounded bg-[#0972b6] hover:bg-[#134377] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {payingOrderId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5" />
                          )}
                          <span>Thanh toán VNPay ngay</span>
                        </button>
                      </div>
                    )}

                    {showQr && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center space-y-1.5">
                        <img
                          src={order.payment.qrUrl}
                          alt="VietQR"
                          className="w-40 h-40 mx-auto object-contain bg-white p-1 rounded border"
                        />
                        <p className="text-[11px] text-gray-600">
                          Nội dung CK: <strong>{order.payment.bankInfo?.transferContent}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
