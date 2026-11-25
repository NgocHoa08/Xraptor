import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Headphones,
  ShieldCheck,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { BRAND, FEATURED_PADDLES, formatVND } from '../data/siteData';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage({
  product,
  products = [],
  onNavigate,
  onSelectProduct,
  onAddToCart,
  onOpenCart,
}) {
  const current = product || products[1] || FEATURED_PADDLES[1];
  const gallery = current.gallery?.length
    ? current.gallery
    : [
        current.image,
        FEATURED_PADDLES[0].image,
        FEATURED_PADDLES[2].image,
        FEATURED_PADDLES[3].image,
        FEATURED_PADDLES[4].image,
        FEATURED_PADDLES[5].image,
      ];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setActiveImgIdx(0);
    setQty(1);
    setExpanded(false);
  }, [current.id]);

  const similarProducts = products.length
    ? products.filter((p) => p.category === current.category && p.id !== current.id).slice(0, 4)
    : FEATURED_PADDLES.slice(4, 8);
  const specLines = current.specs
    ? current.specs.split('\n').filter(Boolean)
    : [
        'Kích thước: 19cm x 42cm',
        'Độ dày mặt vợt: 16mm',
        'Chiều dài tay cầm: 14cm',
        'Chu vi tay cầm: 11cm',
        'Trọng lượng: 225-235g',
        'Bảo hành 3 tháng, 1 đổi 1',
        'Hàng chính hãng có VAT',
        'Mặt vợt: Multidirectional T700 Raw Carbon',
        'Lõi vợt: ElasticPP Honeycomb',
      ];

  return (
    <div className="bg-white">
      {/* Page Hero Banner matching Figma 109:911 */}
      <section className="relative h-[207px] w-full overflow-hidden">
        <img
          src={BRAND.productHero}
          alt={current.category}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/75" />
        <div className="xr-container relative z-10 h-full flex flex-col justify-between py-4">
          <div className="text-white/90 text-[15px] flex items-center gap-1.5">
            <button onClick={() => onNavigate('home')} className="hover:underline cursor-pointer">
              Trang chủ
            </button>
            <span>/</span>
            <button onClick={() => onNavigate('category')} className="hover:underline cursor-pointer">
              Sản phẩm
            </button>
          </div>
          <h1 className="font-heading font-bold text-[28px] sm:text-[36px] text-white uppercase pb-6">
            {current.category || 'Vợt Pickleball'}
          </h1>
        </div>
      </section>

      {/* Main Product Section */}
      <section className="py-8 lg:py-10">
        <div className="xr-container grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Gallery (6 cols) */}
          <div className="lg:col-span-6">
            <div className="relative bg-[#fdfdfd] border border-[#e5e5e5] rounded-[2px] aspect-square flex items-center justify-center p-6 overflow-hidden">
              <img
                src={gallery[activeImgIdx]}
                alt={current.name}
                className="max-h-full max-w-full object-contain"
              />
              {/* Bottom-Right Prev/Next matching Figma Group 108 */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveImgIdx((i) => (i === 0 ? gallery.length - 1 : i - 1))
                  }
                  className="w-[35px] h-[35px] rounded-[4px] bg-[#f4f4f4] hover:bg-[#e5e5e5] flex items-center justify-center text-black cursor-pointer"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImgIdx((i) => (i + 1) % gallery.length)}
                  className="w-[35px] h-[35px] rounded-[4px] bg-[#f7f7f8] hover:bg-[#e5e5e5] flex items-center justify-center text-black cursor-pointer"
                  aria-label="Ảnh tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 6 Thumbnails matching Figma Frame 47 */}
            <div className="grid grid-cols-6 gap-2.5 mt-4">
              {gallery.slice(0, 6).map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`aspect-square rounded-[2px] bg-[#f2f2f2] border p-1.5 flex items-center justify-center cursor-pointer transition-all ${
                    activeImgIdx === idx
                      ? 'border-[#0972b6] ring-2 ring-[#0972b6]/30'
                      : 'border-[#e5e5e5] hover:border-[#0972b6]/50'
                  }`}
                >
                  <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Info Column (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <h2 className="font-heading font-bold text-[22px] sm:text-[24px] text-black leading-snug mb-3">
              {current.name}
            </h2>

            <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-[#c7c7c7]">
              <div className="flex items-baseline gap-4">
                <span className="text-[24px] font-bold text-[#dd3333]">
                  {formatVND(current.price)}
                </span>
                {current.oldPrice && (
                  <span className="text-[14px] text-[#7e7e7e] line-through">
                    {formatVND(current.oldPrice)}
                  </span>
                )}
              </div>
              <span className="text-[14px] font-medium text-[#3f3d3e]">
                Mã sản phẩm: {current.sku || '12345'}
              </span>
            </div>

            {/* Specifications List matching Figma 109:1215 */}
            <ul className="py-5 space-y-1.5 text-[15.5px] text-black font-light leading-relaxed">
              {specLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            {/* Quantity Selector */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <span className="text-[15.5px] text-[#454645]">Số lượng:</span>
              <div className="inline-flex items-center bg-[#f6f6f6] rounded-[2px] h-[34px]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-[32px] h-full flex items-center justify-center text-[#27272a] hover:bg-gray-200 cursor-pointer font-bold"
                >
                  −
                </button>
                <span className="w-[36px] text-center text-[15px] text-[#6b6b6b] font-medium">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-[32px] h-full flex items-center justify-center text-[#454645] hover:bg-gray-200 cursor-pointer font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-[15px] text-[#454645]">
                ({current.stock ?? 200} sản phẩm có sẵn)
              </span>
            </div>

            {/* 2 CTA Buttons: Black "Thêm vào giỏ hàng" + Blue "Mua ngay" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <button
                onClick={() => onAddToCart(current, qty)}
                className="h-[46px] rounded-[5px] bg-black hover:bg-[#27272a] text-white font-bold text-[15.5px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm vào giỏ hàng</span>
              </button>
              <button
                onClick={() => {
                  onAddToCart(current, qty);
                  onOpenCart();
                }}
                className="h-[46px] rounded-[5px] bg-[#0972b6] hover:bg-[#134377] text-white font-bold text-[15.5px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Mua ngay</span>
              </button>
            </div>

            {/* Free shipping note */}
            <div className="flex items-center gap-2.5 text-[15px] text-[#3f3d3e] mb-5">
              <Truck className="w-5 h-5 text-[#134377] shrink-0" />
              <span>Miễn phí vận chuyển cho đơn hàng từ 3 sản phẩm</span>
            </div>

            {/* Trust Guarantees Box matching Figma Rectangle 1473 */}
            <div className="bg-[#f9f9f9] rounded-[7px] px-5 py-2 divide-y divide-[#dfdfdf]">
              <div className="py-3.5 flex items-center gap-3.5 text-[15px] text-[#3f3d3e]">
                <Headphones className="w-5 h-5 text-[#134377] shrink-0" />
                <span>Hỗ trợ kỹ thuật &amp; tư vấn tận tình 24/7</span>
              </div>
              <div className="py-3.5 flex items-center gap-3.5 text-[15px] text-[#3f3d3e]">
                <ShieldCheck className="w-5 h-5 text-[#134377] shrink-0" />
                <span>Bảo hành chính hãng trên toàn quốc</span>
              </div>
              <div className="py-3.5 flex items-center gap-3.5 text-[15px] text-[#3f3d3e]">
                <PackageCheck className="w-5 h-5 text-[#134377] shrink-0" />
                <span>Sản phẩm mới 100% nguyên seal, fullbox</span>
              </div>
              <div className="py-3.5 flex items-center gap-3.5 text-[15px] text-[#3f3d3e]">
                <Truck className="w-5 h-5 text-[#134377] shrink-0" />
                <span>Giao hàng toàn quốc tất cả các ngày trong tuần</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mô tả sản phẩm matching Figma Group 82 */}
      <section className="py-10">
        <div className="xr-container">
          <h2 className="font-heading font-bold text-[24px] text-[#134377] uppercase mb-5">
            Mô tả sản phẩm
          </h2>
          <div className="relative">
            <div
              className={`space-y-4 text-[15.5px] text-black leading-relaxed transition-all overflow-hidden ${
                expanded ? 'max-h-[2000px]' : 'max-h-[320px]'
              }`}
            >
              <p>
                {current.name} được thiết kế chuyên biệt dành cho người chơi Pickleball từ bán
                chuyên đến chuyên nghiệp. Với công nghệ mặt vợt Multidirectional T700 Raw Carbon kết
                hợp lõi tổ ong ElasticPP Honeycomb, cây vợt mang lại khả năng kiểm soát bóng vượt
                trội, độ xoáy tối ưu và cảm giác đánh đầm tay trong suốt trận đấu.
              </p>
              <p>
                Trọng lượng tiêu chuẩn 225-235g cùng chiều dài tay cầm 14cm giúp người chơi dễ dàng
                thực hiện các pha đánh hai tay, tăng tốc độ vung vợt ở khu vực lưới (kitchen) cũng
                như tạo lực mạnh mẽ khi trả giao bóng từ cuối sân.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt
                ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrum
                exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi
                consequatur. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </p>
              <p>
                Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum. Sản phẩm đi kèm chế độ bảo hành chính hãng 3 tháng, 1
                đổi 1 từ Xraptor Việt Nam và hỗ trợ tư vấn kỹ thuật 24/7.
              </p>
            </div>

            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none" />
            )}
          </div>

          <div className="text-center mt-5">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-2 h-[36px] px-6 rounded-[5px] border border-[#134377] text-[#134377] hover:bg-[#134377] hover:text-white font-medium text-[15px] transition-colors cursor-pointer"
            >
              <span>{expanded ? 'Thu gọn' : 'Xem thêm'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* Sản phẩm tương tự matching Figma 109:1328 (#134377) */}
      <section className="bg-[#134377] py-12">
        <div className="xr-container">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-3">
              <span className="w-[4px] h-[28px] bg-[#0972b6] rounded-full inline-block" />
              <h2 className="font-heading font-bold text-[22px] sm:text-[24px] text-white uppercase">
                Sản phẩm tương tự
              </h2>
            </div>
            <button
              onClick={() => onNavigate('category', { filterCategory: 'Vợt Pickleball' })}
              className="inline-flex items-center gap-2 bg-[#0972b6] hover:bg-[#2a879e] text-white text-[15px] font-medium px-4 py-1.5 rounded-[5px] transition-colors cursor-pointer"
            >
              <span>Xem thêm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
