import React, { useEffect, useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Truck,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { formatVND } from '../data/siteData';
import { api } from '../services/api';

export default function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onOrderSuccess,
}) {
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    paymentMethod: 'COD',
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('cart');
        setError('');
      }, 250);
    }
  }, [open]);

  if (!open) return null;

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map(({ product, qty }) => ({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty,
        })),
      };
      const res = await api.createOrder(payload);
      setCreatedOrder(res.order);
      setStep('success');
      onOrderSuccess(res.order);
      setForm({
        customerName: '',
        phone: '',
        email: '',
        address: '',
        note: '',
        paymentMethod: 'COD',
      });
    } catch (err) {
      setError(err.message || 'Không thể đặt hàng, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex justify-end animate-xr-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-xr-drawer"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#134377] text-white">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' ? (
              <button
                onClick={() => setStep('cart')}
                className="p-1 hover:bg-white/10 rounded cursor-pointer"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <ShoppingBag className="w-5 h-5 text-[#f5dc4a]" />
            )}
            <h3 className="font-heading font-bold text-lg uppercase">
              {step === 'cart' && `Giỏ hàng (${totalQty})`}
              {step === 'checkout' && 'Thông tin đặt hàng'}
              {step === 'success' && 'Đặt hàng thành công'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CART ITEMS */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="font-medium">Giỏ hàng của bạn đang trống</p>
                  <p className="text-sm mt-1">Hãy chọn thêm vợt hoặc phụ kiện Pickleball nhé!</p>
                </div>
              ) : (
                items.map(({ product, qty }) => (
                  <div
                    key={product.id}
                    className="flex gap-3.5 pb-4 border-b border-gray-100"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      decoding="async"
                      className="w-20 h-20 object-contain bg-[#f6f6f6] rounded p-1.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-black line-clamp-2 mb-1">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-[#dd3333] mb-2">
                        {formatVND(product.price)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center bg-[#f6f6f6] rounded h-7">
                          <button
                            onClick={() => onUpdateQty(product.id, qty - 1)}
                            className="w-7 h-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{qty}</span>
                          <button
                            onClick={() => onUpdateQty(product.id, qty + 1)}
                            className="w-7 h-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => onRemove(product.id)}
                          className="text-gray-400 hover:text-[#dd3333] p-1 transition-colors cursor-pointer"
                          aria-label="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-gray-200 bg-[#f8f8f8] space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="font-medium text-gray-700">Tạm tính:</span>
                  <span className="font-bold text-xl text-[#dd3333]">
                    {formatVND(total)}
                  </span>
                </div>
                {totalQty >= 3 && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 shrink-0" />
                    Miễn phí vận chuyển cho đơn từ 3 sản phẩm!
                  </p>
                )}
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full h-11 rounded-[5px] bg-[#0972b6] hover:bg-[#134377] active:scale-[0.99] text-white font-bold uppercase text-sm transition-all cursor-pointer"
                >
                  Tiến hành đặt hàng
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: CHECKOUT FORM */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Họ và tên người nhận *
                </label>
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full h-10 px-3 rounded border border-gray-300 text-sm outline-none focus:border-[#0972b6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0949 331 386"
                    className="w-full h-10 px-3 rounded border border-gray-300 text-sm outline-none focus:border-[#0972b6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@gmail.com"
                    className="w-full h-10 px-3 rounded border border-gray-300 text-sm outline-none focus:border-[#0972b6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Địa chỉ giao hàng *
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="w-full p-3 rounded border border-gray-300 text-sm outline-none focus:border-[#0972b6] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'COD', label: 'Thanh toán khi nhận (COD)', icon: Truck },
                    { id: 'Chuyển khoản', label: 'Chuyển khoản ngân hàng', icon: CreditCard },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setForm({ ...form, paymentMethod: opt.id })}
                        className={`p-2.5 rounded border text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                          form.paymentMethod === opt.id
                            ? 'border-[#0972b6] bg-[#edf8ff] text-[#134377]'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Ghi chú đơn hàng
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Size giày, khung giờ giao hàng, xuất VAT..."
                  className="w-full h-10 px-3 rounded border border-gray-300 text-sm outline-none focus:border-[#0972b6]"
                />
              </div>

              {/* Order summary */}
              <div className="bg-[#f8f8f8] rounded-lg p-3.5 space-y-2 border border-gray-200">
                <p className="text-xs font-bold uppercase text-[#134377]">
                  Tóm tắt đơn hàng ({totalQty} sản phẩm)
                </p>
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex justify-between text-xs text-gray-700 gap-2">
                    <span className="truncate">
                      {product.name} × {qty}
                    </span>
                    <span className="font-semibold shrink-0">{formatVND(product.price * qty)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
                  <span>Tổng thanh toán:</span>
                  <span className="text-[#dd3333]">{formatVND(total)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-[#f8f8f8]">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-[5px] bg-[#0972b6] hover:bg-[#134377] disabled:opacity-60 text-white font-bold uppercase text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận đặt hàng ({formatVND(total)})</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && createdOrder && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="font-heading text-xl font-bold text-[#134377] uppercase">
              Cảm ơn bạn đã đặt hàng!
            </h4>
            <p className="text-sm text-gray-600">
              Đơn hàng của bạn đã được ghi nhận vào hệ thống Xraptor. Nhân viên sẽ liên hệ xác nhận
              trong thời gian sớm nhất.
            </p>
            <div className="w-full bg-[#edf8ff] border border-[#0972b6]/30 rounded-lg p-4 text-left space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-bold text-[#134377]">{createdOrder.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Người nhận:</span>
                <span className="font-medium">{createdOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-[#dd3333]">
                  {formatVND(createdOrder.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className="px-2 py-0.5 rounded bg-[#f5dc4a] text-black text-xs font-bold">
                  {createdOrder.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full h-11 rounded-[5px] bg-[#134377] hover:bg-[#0972b6] text-white font-bold text-sm uppercase cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
