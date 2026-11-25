import React, { useEffect } from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { formatVND } from '../data/siteData';

export default function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onCheckout,
}) {
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

  if (!open) return null;

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex justify-end animate-xr-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-xr-drawer"
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#134377] text-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#f5dc4a]" />
            <h3 className="font-heading font-bold text-lg uppercase">
              Giỏ hàng ({items.reduce((s, i) => s + i.qty, 0)})
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
            <button
              onClick={onCheckout}
              className="w-full h-11 rounded-[5px] bg-[#0972b6] hover:bg-[#134377] active:scale-[0.99] text-white font-bold uppercase text-sm transition-all cursor-pointer"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
