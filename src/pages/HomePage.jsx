import React, { useState, useEffect } from 'react';
import {
  Award,
  Layers,
  Headphones,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  X,
} from 'lucide-react';
import {
  BRAND,
  WHY_CHOOSE_US,
  CATEGORIES,
  FEATURED_PADDLES,
  BALL_PROMO,
  BALL_PRODUCTS,
  SHOE_PROMO,
  SHOE_PRODUCTS,
  NET_PROMO,
  NET_PRODUCTS,
  TESTIMONIALS,
  VIDEO_REVIEWS,
  BLOG_POSTS,
} from '../data/siteData';
import ProductCard from '../components/ProductCard';

const ICON_MAP = {
  award: Award,
  layers: Layers,
  headphones: Headphones,
  users: Users,
};

function AccessorySubSection({
  title,
  promoImage,
  products,
  filterKey,
  onNavigate,
  onSelectProduct,
  onAddToCart,
  borderColor = '#2a879e',
}) {
  return (
    <div className="pt-8 pb-10 border-t" style={{ borderColor }}>
      {/* Sub-section header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-[4px] h-[30px] rounded-full bg-[#2a879e] inline-block" />
          <h3 className="font-heading font-bold text-[22px] sm:text-[24px] text-black uppercase">
            {title}
          </h3>
        </div>
        <button
          onClick={() => onNavigate('category', { filterCategory: filterKey })}
          className="inline-flex items-center gap-2 bg-[#0972b6] hover:bg-[#134377] active:scale-[0.98] text-white text-[15px] font-medium px-4 py-1.5 rounded-[5px] transition-all cursor-pointer"
        >
          <span>Xem toàn bộ</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Row 1: 2-col promo image + 2 product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <div
          onClick={() => onNavigate('category', { filterCategory: filterKey })}
          className="sm:col-span-2 rounded-[5px] overflow-hidden h-[354px] cursor-pointer group relative"
        >
          <img
            src={promoImage}
            alt={title}
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 will-change-transform"
          />
        </div>
        {products.slice(0, 2).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onSelect={onSelectProduct}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Row 2: 4 product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.slice(2, 6).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onSelect={onSelectProduct}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage({ onNavigate, onSelectProduct, onAddToCart }) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [testiIdx, setTestiIdx] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);

  // Smooth auto-play hero slider (pauses on hover)
  useEffect(() => {
    if (heroPaused) return;
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % BRAND.heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroPaused]);

  return (
    <div className="bg-white">
      {/* 1. HERO BANNER — Smooth Crossfade Slider */}
      <section
        className="relative w-full bg-[#0c2d54] overflow-hidden group"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="max-w-[1440px] mx-auto relative h-[260px] sm:h-[420px] lg:h-[613px]">
          {BRAND.heroSlides.map((slide, idx) => (
            <img
              key={slide}
              src={slide}
              alt={`Xraptor Pickleball Hero ${idx + 1}`}
              fetchPriority={idx === 0 ? 'high' : 'low'}
              decoding={idx === 0 ? 'sync' : 'async'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
                heroIdx === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
              }`}
            />
          ))}

          {/* Subtle Prev/Next Controls on Hover */}
          <button
            onClick={() =>
              setHeroIdx((i) => (i === 0 ? BRAND.heroSlides.length - 1 : i - 1))
            }
            aria-label="Slide trước"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/55 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setHeroIdx((i) => (i + 1) % BRAND.heroSlides.length)}
            aria-label="Slide sau"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/55 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slider Dots matching Figma Frame 23 */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
            {BRAND.heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIdx(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-[11px] rounded-full border border-white transition-all duration-300 cursor-pointer ${
                  heroIdx === idx
                    ? 'w-[24px] bg-white'
                    : 'w-[11px] bg-transparent hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. VÌ SAO CHỌN CHÚNG TÔI */}
      <section className="bg-[#f8f8f8] py-12 lg:py-14">
        <div className="xr-container">
          <h2 className="font-heading font-bold text-[28px] sm:text-[36px] text-[#0972b6] text-center uppercase mb-10">
            Vì sao chọn chúng tôi?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = ICON_MAP[item.icon] || Award;
              return (
                <div
                  key={item.id}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="w-[90px] h-[90px] rounded-full bg-[#134377] group-hover:bg-[#0972b6] group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center mb-5 shadow-md">
                    <Icon className="w-10 h-10 text-white" strokeWidth={1.7} />
                  </div>
                  <h3 className="font-bold text-[16px] uppercase text-[#050505] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[15px] text-[#050505]/85 leading-relaxed max-w-[260px]">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC SẢN PHẨM */}
      <section className="py-12 lg:py-14 xr-section-cv">
        <div className="xr-container">
          <h2 className="font-heading font-bold text-[28px] sm:text-[36px] text-[#134377] text-center uppercase mb-8">
            Danh mục sản phẩm
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('category', { filterCategory: cat.filterKey })}
                className="group relative rounded-[15px] overflow-hidden h-[380px] sm:h-[435px] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 will-change-transform"
                />
                {/* Bottom bar matching Figma Rectangle 1486 */}
                <div className="absolute inset-x-0 bottom-0 h-[62px] px-4 flex items-center justify-between bg-gradient-to-b from-white/95 to-[#d7d7d7]/95 rounded-b-[15px]">
                  <span className="font-bold text-[22px] text-black capitalize">
                    {cat.label}
                  </span>
                  <span className="px-4 py-1.5 rounded-[5px] bg-[#f5dc4a] group-hover:bg-[#ebd035] text-black font-bold text-[15px] transition-colors">
                    Xem thêm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SẢN PHẨM NỔI BẬT */}
      <section className="py-10 lg:py-12 xr-section-cv">
        <div className="xr-container">
          <div className="flex items-center justify-between mb-7">
            <h2 className="font-heading font-bold text-[28px] sm:text-[36px] text-[#134377] uppercase">
              Sản phẩm nổi bật
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('category', { filterCategory: 'Vợt Pickleball' })}
                aria-label="Trước"
                className="w-[37px] h-[37px] rounded-[5px] bg-[#f6f6f6] hover:bg-[#e5e5e5] flex items-center justify-center text-[#404040] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate('category', { filterCategory: 'Vợt Pickleball' })}
                aria-label="Sau"
                className="w-[37px] h-[37px] rounded-[5px] bg-[#f6f6f6] hover:bg-[#e5e5e5] flex items-center justify-center text-[#404040] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_PADDLES.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. VỀ XRAPTOR MID BANNER */}
      <section id="ve-xraptor" className="relative bg-black overflow-hidden my-6 xr-section-cv">
        {/* Full-bleed background layers matching Figma 357:1025 */}
        <img
          src={BRAND.aboutBannerBg}
          alt=""
          decoding="async"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />
        <img
          src={BRAND.aboutBannerGradient}
          alt=""
          decoding="async"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent pointer-events-none" />

        {/* Subtle Xraptor logo watermark behind text matching Figma 211:5816 */}
        <img
          src={BRAND.logo}
          alt=""
          decoding="async"
          loading="lazy"
          className="hidden lg:block absolute left-[14%] top-1/2 -translate-y-1/2 w-[420px] opacity-[0.08] brightness-0 invert pointer-events-none select-none z-[1]"
        />

        {/* 2-Column Container: Left text (x=120..702) & Right paddles (x=793..1344) — zero overlap */}
        <div className="xr-container relative z-10 min-h-[491px] grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
          <div className="lg:col-span-6 py-12 text-white max-w-[582px]">
            <h2 className="font-heading font-bold text-[30px] sm:text-[36px] uppercase mb-5">
              Về Xraptor
            </h2>
            <div className="space-y-4 font-roboto text-[15.5px] leading-relaxed text-white/95">
              <p>
                XRAPTOR tự hào là đơn vị tiên phong mang đến những sản phẩm vợt Pickleball chất
                lượng cao, đáp ứng nhu cầu của cả người chơi mới lẫn vận động viên chuyên nghiệp.
              </p>
              <div>
                <p className="font-bold text-white mb-0.5">Sứ mệnh</p>
                <p>
                  Với sứ mệnh “lan tỏa đam mê, nâng tầm trải nghiệm”, chúng tôi không chỉ bán vợt,
                  mà còn truyền cảm hứng để pickleball trở thành một môn thể thao gắn kết cộng đồng,
                  khỏe mạnh và vui tươi.
                </p>
              </div>
              <div>
                <p className="font-bold text-white mb-0.5">Tầm nhìn</p>
                <p>
                  Trở thành thương hiệu Pickleball hàng đầu Việt Nam, mang đến trải nghiệm thể thao
                  mới mẻ, nơi mọi người có thể rèn luyện sức khỏe, kết nối bạn bè và chinh phục giới
                  hạn bản thân.
                </p>
              </div>
              <p>
                Nếu bạn đang tìm một cây vợt phù hợp để bắt đầu hoặc nâng tầm kỹ năng, hãy đến với
                Xraptor – nơi niềm vui thể thao bắt đầu!
              </p>
            </div>
            <button
              onClick={() => onNavigate('contact')}
              className="mt-6 h-[40px] px-7 rounded-[5px] bg-[#0972b6] hover:bg-[#134377] active:scale-[0.98] text-white font-bold text-[15px] transition-all cursor-pointer"
            >
              Tìm hiểu thêm
            </button>
          </div>

          <div className="lg:col-span-6 flex items-end justify-center lg:justify-end self-end">
            <img
              src={BRAND.aboutBannerPaddles}
              alt="Xraptor Paddles Collection"
              decoding="async"
              loading="lazy"
              className="w-full max-w-[540px] max-h-[491px] object-contain object-bottom pointer-events-none select-none"
            />
          </div>
        </div>
      </section>

      {/* 6. PHỤ KIỆN PICKLEBALL */}
      <section className="py-12 xr-section-cv">
        <div className="xr-container">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-[28px] sm:text-[36px] text-[#134377] uppercase mb-2">
              Phụ kiện Pickleball
            </h2>
            <p className="text-[15.5px] text-black/80">
              Top các phụ kiện pickleball hỗ trợ người chơi từ mới đến chuyên nghiệp
            </p>
          </div>

          <AccessorySubSection
            title="Bóng pickleball"
            promoImage={BALL_PROMO}
            products={BALL_PRODUCTS}
            filterKey="Bóng Pickleball"
            borderColor="#2a879e"
            onNavigate={onNavigate}
            onSelectProduct={onSelectProduct}
            onAddToCart={onAddToCart}
          />

          <AccessorySubSection
            title="Giày pickleball"
            promoImage={SHOE_PROMO}
            products={SHOE_PRODUCTS}
            filterKey="Giày Pickleball"
            borderColor="#134377"
            onNavigate={onNavigate}
            onSelectProduct={onSelectProduct}
            onAddToCart={onAddToCart}
          />

          <AccessorySubSection
            title="Lưới pickleball chất lượng cao"
            promoImage={NET_PROMO}
            products={NET_PRODUCTS}
            filterKey="Lưới Pickleball"
            borderColor="#134377"
            onNavigate={onNavigate}
            onSelectProduct={onSelectProduct}
            onAddToCart={onAddToCart}
          />
        </div>
      </section>

      {/* 7. PHẢN HỒI VỀ CHÚNG TÔI */}
      <section className="bg-[#edf8ff] py-14 xr-section-cv">
        <div className="xr-container">
          <div className="text-center mb-9">
            <h2 className="font-heading font-bold text-[28px] sm:text-[36px] text-[#134377] uppercase mb-2">
              Phản hồi về chúng tôi
            </h2>
            <p className="text-[15.5px] text-black/80">
              Những nhận xét và trải nghiệm thực tế từ khách hàng sau khi sử dụng sản phẩm của
              Xraptor
            </p>
          </div>

          <div className="relative lg:px-14">
            <button
              onClick={() => setTestiIdx((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))}
              aria-label="Trước"
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 w-[37px] h-[37px] rounded-[5px] bg-white hover:bg-[#f0f0f0] shadow-sm items-center justify-center text-[#404040] transition-colors cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => setTestiIdx(i)}
                  className={`bg-white rounded-[11px] p-7 shadow-sm flex flex-col justify-between min-h-[201px] transition-all duration-300 cursor-pointer ${
                    i === testiIdx
                      ? 'ring-2 ring-[#0972b6]/40 -translate-y-0.5 shadow-md'
                      : 'hover:-translate-y-0.5'
                  }`}
                >
                  <p className="italic text-[15.5px] text-black text-center leading-relaxed mb-5">
                    “{t.quote}”
                  </p>
                  <div className="flex items-center justify-center gap-3.5">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      decoding="async"
                      loading="lazy"
                      className="w-[62px] h-[62px] rounded-full object-cover border-2 border-[#edf8ff]"
                    />
                    <div>
                      <p className="font-bold text-[16px] text-black">{t.name}</p>
                      <p className="text-[13.5px] text-black/40">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTestiIdx((prev) => (prev + 1) % TESTIMONIALS.length)}
              aria-label="Sau"
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 w-[37px] h-[37px] rounded-[5px] bg-[#f6f6f6] hover:bg-white shadow-sm items-center justify-center text-[#404040] transition-colors cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-7 mb-10">
            {[0, 1, 2, 3, 4, 5, 6].map((dot) => (
              <button
                key={dot}
                onClick={() => setTestiIdx(dot % TESTIMONIALS.length)}
                className={`w-[10px] h-[10px] rounded-full border border-black cursor-pointer transition-all duration-200 ${
                  dot === testiIdx ? 'bg-black scale-110' : 'bg-transparent hover:bg-black/30'
                }`}
                aria-label={`Slide ${dot + 1}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VIDEO_REVIEWS.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActiveVideo(vid)}
                className="group relative rounded-[11px] overflow-hidden h-[420px] sm:h-[465px] cursor-pointer shadow-md"
              >
                <img
                  src={vid.image}
                  alt={vid.title}
                  decoding="async"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 will-change-transform"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                  <div className="w-[58px] h-[58px] rounded-full bg-[#134377]/85 group-hover:bg-[#0972b6] group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BLOG - TIN TỨC */}
      <section id="blog-section" className="bg-[#134377] py-14 text-white xr-section-cv">
        <div className="xr-container">
          <h2 className="font-heading font-bold text-[28px] sm:text-[36px] text-white text-center uppercase mb-9">
            Blog - Tin tức
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-10">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.id}
                className="group cursor-pointer"
                onClick={() => onNavigate('contact')}
              >
                <div className="rounded-[5px] overflow-hidden h-[259px] mb-3.5">
                  <img
                    src={post.image}
                    alt={post.title}
                    decoding="async"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 will-change-transform"
                  />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-[5px] bg-[#f5dc4a] text-[#1e1e1e] text-[13px] font-semibold">
                    {post.tag}
                  </span>
                  <span className="text-[14px] text-white/90">{post.date}</span>
                </div>
                <h3 className="font-semibold text-[16px] text-white leading-snug group-hover:text-[#f5dc4a] transition-colors">
                  {post.title}
                </h3>
              </article>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('category')}
              className="h-[40px] px-8 rounded-[5px] bg-[#0972b6] hover:bg-[#2a879e] active:scale-[0.98] text-white font-bold text-[15px] transition-all cursor-pointer"
            >
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[2px] flex items-center justify-center p-4 animate-xr-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative animate-xr-fade"
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeVideo.image}
              alt={activeVideo.title}
              className="w-full h-[460px] object-cover"
            />
            <div className="p-4 flex items-center justify-between">
              <p className="font-bold text-[#134377]">{activeVideo.title}</p>
              <span className="text-xs px-2.5 py-1 rounded bg-[#edf8ff] text-[#0972b6] font-semibold">
                Video Review
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
