import React, { useEffect, useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Truck,
  CreditCard,
  QrCode,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '../data/siteData';
import { api } from '../services/api';

const PAYMENT_OPTIONS = [
  {
    id: 'COD',
    label: 'Thanh toán khi nhận (COD)',
    desc: 'Trả tiền mặt khi giao hàng',
    icon: Truck,
  },
  {
    id: 'VIETQR',
    label: 'Chuyển khoản VietQR',
    desc: 'Quét mã QR ngân hàng 24/7',
    icon: QrCode,
  },
  {
    id: 'VNPAY',
    label: 'Cổng thanh toán VNPay',
    desc: 'ATM nội địa / QR / Visa',
    icon: CreditCard,
  },
];

const PAYMENT_BADGE = {
  'Đã thanh toán': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Đang chờ thanh toán': 'bg-amber-100 text-amber-800 border-amber-200',
  'Chưa thanh toán': 'bg-gray-100 text-gray-700 border-gray-200',
  'Thất bại': 'bg-rose-100 text-rose-700 border-rose-200',
  'Đã hoàn tiền': 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onOrderSuccess,
}) {
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'payment' | 'success'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [selectedBank, setSelectedBank] = useState('NCB');
  const [processingPay, setProcessingPay] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
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
        setPayment(null);
        setCreatedOrder(null);
      }, 250);
    }
  }, [open]);

  if (!open) return null;

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  const handleCopy = (label, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 1800);
  };

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
      setPayment(res.payment || res.order?.payment || null);
      onOrderSuccess(res.order);
      setForm({
        customerName: '',
        phone: '',
        email: '',
        address: '',
        note: '',
        paymentMethod: 'COD',
      });

      if (payload.paymentMethod === 'COD') {
        setStep('success');
      } else {
        setStep('payment');
      }
    } catch (err) {
      setError(err.message || 'Không thể đặt hàng, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSandboxPay = async (outcome) => {
    if (!payment) return;
    setProcessingPay(true);
    setError('');
    try {
      const res = await api.confirmSandboxPayment({
        transactionCode: payment.transactionCode,
        signature: payment.metadata?.sandboxSignature,
        outcome,
        bankCode: selectedBank,
      });
      setPayment(res.payment);
      if (res.order) setCreatedOrder(res.order);
      if (outcome === 'success') {
        setStep('success');
      } else {
        setError('Giao dịch đã bị hủy. Bạn có thể thử thanh toán lại hoặc đổi sang VietQR.');
      }
    } catch (err) {
      setError(err.message || 'Không thể xử lý giao dịch.');
    } finally {
      setProcessingPay(false);
    }
  };

  const handleSwitchOrRetryPayment = async (method) => {
    if (!createdOrder) return;
    setProcessingPay(true);
    setError('');
    try {
      const res = await api.createPaymentIntent({
        orderCode: createdOrder.order_code,
        method,
      });
      setPayment(res.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!createdOrder) return;
    setCheckingStatus(true);
    setError('');
    try {
      const res = await api.getOrderPayment(createdOrder.order_code);
      if (res.payment) setPayment(res.payment);
      if (res.order) setCreatedOrder((prev) => ({ ...prev, ...res.order }));
      if (res.order?.payment_status === 'Đã thanh toán') {
        setStep('success');
      } else {
        setError(
          'Hệ thống chưa ghi nhận giao dịch chuyển khoản. Nếu bạn vừa chuyển, kế toán sẽ xác nhận trong ít phút.'
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingStatus(false);
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
              {step === 'payment' && 'Thanh toán đơn hàng'}
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
                <div className="space-y-2">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = form.paymentMethod === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setForm({ ...form, paymentMethod: opt.id })}
                        className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 cursor-pointer transition-all ${
                          active
                            ? 'border-[#0972b6] bg-[#edf8ff] text-[#134377] ring-1 ring-[#0972b6]'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? 'bg-[#0972b6] text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold">{opt.label}</p>
                          <p className="text-[11px] text-gray-500">{opt.desc}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            active ? 'border-[#0972b6]' : 'border-gray-300'
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-[#0972b6]" />}
                        </div>
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
                <span>
                  {form.paymentMethod === 'COD'
                    ? `Xác nhận đặt hàng (${formatVND(total)})`
                    : `Tiếp tục thanh toán (${formatVND(total)})`}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ONLINE PAYMENT (VIETQR / VNPAY SANDBOX) */}
        {step === 'payment' && createdOrder && payment && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-[#edf8ff] border border-[#0972b6]/30 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold text-gray-500">Mã đơn hàng</p>
                <p className="font-bold text-[#134377]">{createdOrder.order_code}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase font-bold text-gray-500">Số tiền</p>
                <p className="font-bold text-lg text-[#dd3333]">
                  {formatVND(payment.amount)}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* VIETQR FLOW */}
            {payment.method === 'VIETQR' && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center space-y-2 shadow-xs">
                  <p className="text-xs font-bold uppercase text-[#134377] flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#0972b6]" />
                    Quét mã VietQR bằng ứng dụng Ngân hàng
                  </p>
                  {payment.qrUrl && (
                    <img
                      src={payment.qrUrl}
                      alt="VietQR Xraptor"
                      className="w-56 h-56 mx-auto object-contain rounded-lg border border-gray-100 p-1 bg-white"
                    />
                  )}
                  <p className="text-[11px] text-gray-500">
                    Mã QR đã tự động điền đúng số tiền và nội dung chuyển khoản
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                  {[
                    { key: 'bank', label: 'Ngân hàng', value: payment.bankInfo?.bankName },
                    { key: 'acc', label: 'Số tài khoản', value: payment.bankInfo?.accountNo, copy: true },
                    { key: 'name', label: 'Chủ tài khoản', value: payment.bankInfo?.accountName },
                    {
                      key: 'content',
                      label: 'Nội dung CK',
                      value: payment.bankInfo?.transferContent,
                      copy: true,
                      highlight: true,
                    },
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">{row.label}:</span>
                      <div className="flex items-center gap-1.5 font-bold text-right">
                        <span className={row.highlight ? 'text-[#dd3333]' : 'text-[#134377]'}>
                          {row.value}
                        </span>
                        {row.copy && (
                          <button
                            type="button"
                            onClick={() => handleCopy(row.key, row.value)}
                            className="p-1 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
                            title="Sao chép"
                          >
                            {copiedField === row.key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCheckPaymentStatus}
                    disabled={checkingStatus}
                    className="w-full h-11 rounded-lg bg-[#0972b6] hover:bg-[#134377] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                    <span>Tôi đã chuyển khoản — Kiểm tra trạng thái</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('success')}
                    className="w-full h-10 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs cursor-pointer"
                  >
                    Hoàn tất &amp; để Admin xác nhận sau
                  </button>
                </div>
              </div>
            )}

            {/* VNPAY LIVE / SANDBOX FLOW */}
            {payment.method === 'VNPAY' && (
              <div className="space-y-4">
                {payment.paymentUrl ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 text-center space-y-3">
                    <ShieldCheck className="w-10 h-10 text-[#0972b6] mx-auto" />
                    <h4 className="font-bold text-[#134377]">Kết nối cổng thanh toán VNPay</h4>
                    <p className="text-xs text-gray-600">
                      Giao dịch được ký bảo mật HMAC-SHA512. Nhấn nút bên dưới để chuyển sang trang
                      thanh toán VNPay.
                    </p>
                    <a
                      href={payment.paymentUrl}
                      className="w-full h-11 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <span>Mở cổng thanh toán VNPay</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-[#0972b6]/30 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#134377] to-[#0972b6] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#f5dc4a]" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide">
                            VNPay Sandbox Gateway
                          </p>
                          <p className="text-[10px] text-white/80">
                            Mã GD: {payment.transactionCode}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#f5dc4a] text-black text-[10px] font-bold">
                        HMAC-SHA256
                      </span>
                    </div>

                    <div className="p-4 space-y-3.5">
                      <div>
                        <p className="text-xs font-bold text-gray-700 mb-2">
                          Chọn ngân hàng / phương thức thanh toán
                        </p>
                        <div className="space-y-1.5">
                          {(
                            payment.metadata?.supportedBanks || [
                              { code: 'NCB', name: 'Ngân hàng NCB (Thẻ test VNPay)' },
                              { code: 'VNPAYQR', name: 'Ứng dụng quét mã VNPAY-QR' },
                              { code: 'VCB', name: 'Vietcombank ATM / Internet Banking' },
                              { code: 'VISA', name: 'Thẻ quốc tế Visa / Mastercard' },
                            ]
                          ).map((bank) => (
                            <button
                              type="button"
                              key={bank.code}
                              onClick={() => setSelectedBank(bank.code)}
                              className={`w-full px-3 py-2 rounded-lg border text-left text-xs font-medium flex items-center justify-between cursor-pointer ${
                                selectedBank === bank.code
                                  ? 'border-[#0972b6] bg-[#edf8ff] text-[#134377] font-bold'
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>{bank.name}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200">
                                {bank.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {payment.status === 'Thất bại' ? (
                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            disabled={processingPay}
                            onClick={() => handleSwitchOrRetryPayment('VNPAY')}
                            className="w-full h-10 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white font-bold text-xs cursor-pointer"
                          >
                            Tạo lại giao dịch VNPay
                          </button>
                          <button
                            type="button"
                            disabled={processingPay}
                            onClick={() => handleSwitchOrRetryPayment('VIETQR')}
                            className="w-full h-10 rounded-lg border border-[#0972b6] text-[#0972b6] hover:bg-[#edf8ff] font-bold text-xs cursor-pointer"
                          >
                            Chuyển sang thanh toán VietQR
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            disabled={processingPay}
                            onClick={() => handleSandboxPay('success')}
                            className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {processingPay ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>Xác nhận thanh toán ({formatVND(payment.amount)})</span>
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={processingPay}
                              onClick={() => handleSandboxPay('failed')}
                              className="h-9 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                            >
                              Hủy giao dịch
                            </button>
                            <button
                              type="button"
                              disabled={processingPay}
                              onClick={() => handleSwitchOrRetryPayment('VIETQR')}
                              className="h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                            >
                              Đổi sang VietQR
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && createdOrder && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="font-heading text-xl font-bold text-[#134377] uppercase">
              {createdOrder.payment_status === 'Đã thanh toán'
                ? 'Thanh toán & đặt hàng thành công!'
                : 'Cảm ơn bạn đã đặt hàng!'}
            </h4>
            <p className="text-sm text-gray-600">
              {createdOrder.payment_status === 'Đã thanh toán'
                ? 'Giao dịch đã được xác nhận thành công. Xraptor đang chuẩn bị hàng để giao đến bạn.'
                : 'Đơn hàng của bạn đã được ghi nhận vào hệ thống Xraptor. Nhân viên sẽ liên hệ xác nhận trong thời gian sớm nhất.'}
            </p>
            <div className="w-full bg-[#edf8ff] border border-[#0972b6]/30 rounded-lg p-4 text-left space-y-2 text-sm">
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
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Thanh toán:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    PAYMENT_BADGE[createdOrder.payment_status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {createdOrder.payment_method} • {createdOrder.payment_status || 'Chưa thanh toán'}
                </span>
              </div>
              {payment?.gatewayTxnNo && (
                <div className="flex justify-between text-xs pt-1 border-t border-[#0972b6]/15">
                  <span className="text-gray-500">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-[#134377]">
                    {payment.gatewayTxnNo}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trạng thái đơn:</span>
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
