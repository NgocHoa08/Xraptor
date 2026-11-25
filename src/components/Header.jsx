import React, { useState } from 'react';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { BRAND } from '../data/siteData';

const NAV_ITEMS = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'paddles', label: 'Vợt Pickleball' },
  { id: 'category', label: 'Phụ kiện Pickleball' },
  { id: 'contact', label: 'Liên hệ' },
];

export default function Header({
  activePage,
  onNavigate,
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    setMobileOpen(false);
    if (id === 'about') {
      onNavigate('home');
      setTimeout(() => {
        document.getElementById('ve-xraptor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    if (id === 'paddles') {
      onNavigate('category', { filterCategory: 'Vợt Pickleball' });
      return;
    }
    onNavigate(id);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('category');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#134377]/20 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
      <div className="xr-container flex items-center justify-between h-[82px] gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="shrink-0 cursor-pointer focus:outline-none"
          aria-label="Xraptor Home"
        >
          <img
            src={BRAND.logo}
            alt="Xraptor Logo"
            className="h-[62px] w-auto object-contain"
          />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive =
              (item.id === 'home' && activePage === 'home') ||
              (item.id === 'category' && activePage === 'category') ||
              (item.id === 'contact' && activePage === 'contact') ||
              (item.id === 'paddles' && activePage === 'product');
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`text-[15px] font-bold transition-colors cursor-pointer whitespace-nowrap py-2 relative ${
                  isActive
                    ? 'text-[#0972b6]'
                    : 'text-[#000000] hover:text-[#0972b6]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0972b6] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Search & Cart */}
        <div className="flex items-center gap-5">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex items-center bg-[#eeeeee] rounded-[4px] h-[34px] w-[193px] px-2.5 gap-2"
          >
            <Search className="w-4 h-4 text-[#3d3d3d] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm"
              className="bg-transparent text-[14px] text-[#27272a] placeholder-[#6a6c6f] outline-none w-full"
            />
          </form>

          <button
            onClick={onOpenCart}
            className="relative p-1 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-[22px] h-[22px] text-black" strokeWidth={2.2} />
            <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#f5dc4a] text-black text-[11px] font-bold flex items-center justify-center leading-none">
              {cartCount}
            </span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 text-[#134377]"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-md">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-[#eeeeee] rounded-[4px] h-[38px] px-3 gap-2"
          >
            <Search className="w-4 h-4 text-[#3d3d3d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="bg-transparent text-[14px] text-[#27272a] placeholder-[#6a6c6f] outline-none w-full"
            />
          </form>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="text-left py-2 px-2 font-bold text-[15px] text-black hover:text-[#0972b6] hover:bg-[#edf8ff] rounded"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
