import React, { useState } from 'react';
import { X, Search, Package, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { formatVND } from '../data/siteData';

const STATUS_STYLE = {
  'Chờ xác nhận': 'bg-amber-100 text-amber-800',
  'Đang xử lý': 'bg-blue-100 text-blue-800',
  'Đang giao': 'bg-indigo-100 text-indigo-800',
  'Hoàn thành': 'bg-emerald-100 text-emerald-800',
  'Đã hủy': 'bg-red-100 text-red-800',
};

export default function OrderTrackingModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.trackOrders(query.trim());
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-2.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#134377]">{order.order_code}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status}
                    </span>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
