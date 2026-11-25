import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import {
  BRAND,
  ALL_PRODUCTS,
  CATEGORY_PAGE_PRODUCTS,
  SIDEBAR_FILTERS,
  BALL_PRODUCTS,
} from '../data/siteData';
import ProductCard from '../components/ProductCard';

export default function CategoryPage({
  products = [],
  initialFilter,
  searchQuery,
  onNavigate,
  onSelectProduct,
  onAddToCart,
}) {
  const catalog = products.length ? products : ALL_PRODUCTS;
  const [selectedFilters, setSelectedFilters] = useState(
    initialFilter ? [initialFilter] : []
  );
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (initialFilter) {
      setSelectedFilters([initialFilter]);
    } else {
      setSelectedFilters([]);
    }
    setCurrentPage(1);
  }, [initialFilter]);

  const toggleFilter = (val) => {
    setCurrentPage(1);
    setSelectedFilters((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const filteredProducts = useMemo(() => {
    let base =
      selectedFilters.length === 0 && !searchQuery.trim()
        ? (products.length ? products.filter((p) => p.category !== 'Vợt Pickleball').slice(0, 12) : CATEGORY_PAGE_PRODUCTS)
        : catalog;

    if (selectedFilters.length > 0) {
      base = base.filter(
        (p) =>
          selectedFilters.includes(p.category) ||
          selectedFilters.includes(p.subCategory)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    const list = [...base];
    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [selectedFilters, sortBy, searchQuery, products, catalog]);

  const pageTitle =
    selectedFilters.length === 1
      ? selectedFilters[0]
      : 'Phụ kiện Pickleball';

  const recentlyViewed = BALL_PRODUCTS.slice(2, 6);

  return (
    <div className="bg-white">
      {/* Page Hero Banner matching Figma 98:493 */}
      <section className="relative h-[207px] w-full overflow-hidden">
        <img
          src={BRAND.categoryHero}
          alt={pageTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/75" />
        <div className="xr-container relative z-10 h-full flex flex-col justify-between py-4">
          <div className="text-white/90 text-[15px] flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('home')}
              className="hover:underline cursor-pointer"
            >
              Trang chủ
            </button>
            <span>/</span>
            <span>Sản phẩm</span>
          </div>
          <h1 className="font-heading font-bold text-[28px] sm:text-[36px] text-white uppercase pb-6">
            {pageTitle}
          </h1>
        </div>
      </section>

      {/* Main Content: Sidebar + 3-col Grid */}
      <section className="py-10">
        <div className="xr-container flex flex-col lg:flex-row gap-8">
          {/* Left Filter Sidebar matching Figma Frame 43 */}
          <aside className="w-full lg:w-[230px] shrink-0">
            <h2 className="font-bold text-[16px] text-black pb-3 border-b border-[#dddddd]">
              Danh mục sản phẩm
            </h2>

            {/* Vợt Pickleball */}
            <div className="py-4 border-b border-[#dddddd]">
              <button
                onClick={() => toggleFilter('Vợt Pickleball')}
                className="font-bold text-[16px] text-black mb-3 block hover:text-[#0972b6] cursor-pointer"
              >
                Vợt Pickleball
              </button>
              <div className="space-y-2.5">
                {SIDEBAR_FILTERS.paddles.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2.5 text-[15px] font-medium text-black cursor-pointer hover:text-[#0972b6]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(item)}
                      onChange={() => toggleFilter(item)}
                      className="w-[14px] h-[14px] accent-[#134377] rounded-[2px] cursor-pointer"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Phụ kiện Pickleball */}
            <div className="py-4">
              <p className="font-bold text-[16px] text-black mb-3">
                Phụ kiện Pickleball
              </p>
              <div className="space-y-2.5">
                {SIDEBAR_FILTERS.accessories.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2.5 text-[15px] font-medium text-black cursor-pointer hover:text-[#0972b6]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(item)}
                      onChange={() => toggleFilter(item)}
                      className="w-[14px] h-[14px] accent-[#134377] rounded-[2px] cursor-pointer"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedFilters.length > 0 && (
              <button
                onClick={() => setSelectedFilters([])}
                className="mt-2 text-sm text-[#0972b6] hover:underline font-medium cursor-pointer"
              >
                Xóa bộ lọc ({selectedFilters.length})
              </button>
            )}
          </aside>

          {/* Right Product Listing */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-[4px] h-[28px] bg-[#0972b6] rounded-full inline-block" />
                <h2 className="font-heading font-bold text-[22px] sm:text-[24px] text-black uppercase">
                  {pageTitle}
                </h2>
              </div>

              <div className="relative inline-flex items-center border border-black rounded-[5px] px-3 h-[36px] bg-white">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-[15px] text-black outline-none cursor-pointer"
                >
                  <option value="default">Sắp xếp theo</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="name-asc">Tên: A - Z</option>
                </select>
                <ArrowUpDown className="w-4 h-4 text-black pointer-events-none absolute right-2.5" />
              </div>
            </div>

            {/* 3-Column Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-[#f8f8f8] rounded-lg">
                <p className="text-gray-600 mb-3">
                  Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
                </p>
                <button
                  onClick={() => setSelectedFilters([])}
                  className="px-5 py-2 rounded-[5px] bg-[#0972b6] text-white text-sm font-semibold cursor-pointer"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}

            {/* Pagination matching Figma Frame 13 */}
            <div className="flex items-center justify-center gap-2 mt-10">
              {[1, 2, 3, '...', 10].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  className={`w-[35px] h-[35px] rounded-[4px] text-[14px] font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#134377] text-white'
                      : 'bg-[#f7f7f8] text-black hover:bg-[#e5e7eb]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => (p < 10 ? p + 1 : 1))}
                className="w-[35px] h-[35px] rounded-[4px] bg-[#f7f7f8] hover:bg-[#e5e7eb] text-black flex items-center justify-center cursor-pointer"
                aria-label="Trang tiếp"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sản phẩm đã xem matching Figma 98:765 (Dark Navy #134377) */}
      <section className="bg-[#134377] py-12">
        <div className="xr-container">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <span className="w-[4px] h-[28px] bg-[#2a879e] rounded-full inline-block" />
              <h2 className="font-heading font-bold text-[22px] sm:text-[24px] text-white uppercase">
                Sản phẩm đã xem
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-[37px] h-[37px] rounded-[5px] bg-[#f6f6f6] hover:bg-white text-[#404040] flex items-center justify-center cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="w-[37px] h-[37px] rounded-[5px] bg-[#f6f6f6] hover:bg-white text-[#404040] flex items-center justify-center cursor-pointer">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentlyViewed.map((product) => (
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
    </div>
  );
}
