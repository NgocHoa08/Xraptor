import React, { memo } from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { BRAND, formatVND } from '../data/siteData';

const ProductCard = memo(function ProductCard({ product, onSelect, onAddToCart }) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-[#f6f6f6] rounded-[10px] overflow-hidden cursor-pointer border border-[#f0f0f0] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_12px_28px_rgba(19,67,119,0.12)] hover:-translate-y-1 flex flex-col h-[354px] will-change-transform"
    >
      {/* Top Image Area (289px matching Figma Rectangle 12) */}
      <div className="relative bg-white h-[289px] w-full flex items-center justify-center p-4 overflow-hidden">
        <img
          src={BRAND.logo}
          alt="Xraptor"
          width={38}
          height={28}
          decoding="async"
          loading="lazy"
          className="absolute top-2.5 left-3 w-[38px] h-auto object-contain z-10 pointer-events-none"
        />
        <img
          src={product.image}
          alt={product.name}
          decoding="async"
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 will-change-transform"
        />
      </div>

      {/* Default Bottom Title Area (fades cleanly when hover panel rises) */}
      <div className="px-3.5 py-2.5 flex-1 flex items-center bg-[#f6f6f6] transition-opacity duration-200 group-hover:opacity-0">
        <h3 className="text-[14.5px] font-semibold text-black leading-[1.35] line-clamp-2">
          {product.name}
        </h3>
      </div>

      {/* Hover Overlay matching Figma Group 135 — covers bottom of full card cleanly without duplicate title */}
      <div className="absolute inset-x-0 bottom-0 pt-12 pb-3.5 px-3.5 bg-gradient-to-t from-white via-white to-white/0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 flex flex-col justify-end will-change-transform">
        <p className="text-[14.5px] font-semibold text-black leading-snug line-clamp-2 mb-1.5">
          {product.name}
        </p>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-[16px] font-bold text-[#dd3333]">
            {formatVND(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-[13px] text-[#7e7e7e] line-through">
              {formatVND(product.oldPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, 1);
            }}
            className="flex-1 h-[39px] rounded-[5px] bg-[#f5dc4a] hover:bg-[#ebd035] active:scale-[0.98] text-black font-semibold text-[14.5px] flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Thêm vào giỏ</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="w-[39px] h-[39px] rounded-[5px] bg-[#f6f6f6] hover:bg-[#e5e5e5] active:scale-[0.96] text-black flex items-center justify-center transition-[background-color,transform] duration-150 cursor-pointer"
            aria-label="Xem nhanh"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
