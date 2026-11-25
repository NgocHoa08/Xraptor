import React from 'react';
import { ShieldCheck, Headphones, Truck } from 'lucide-react';
import { BRAND } from '../data/siteData';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-white text-[#134377] pt-8">
      <div className="xr-container">
        {/* Top Row: Logo + Company Name + 3 Trust Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#134377]">
          <div className="flex items-center gap-4">
            <img
              src={BRAND.logo}
              alt="Xraptor"
              className="h-[64px] w-auto object-contain cursor-pointer"
              onClick={() => onNavigate('home')}
            />
            <p className="font-bold text-[17px] text-[#134377] max-w-[295px] leading-snug">
              Công ty cổ phần đầu tư và phát triển Hasuko
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#edf8ff] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#134377]" />
              </div>
              <span className="text-[14px] text-[#3f3d3e] leading-snug">
                Bảo hành chính hãng <br /> trên toàn quốc
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#edf8ff] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-[#134377]" />
              </div>
              <span className="text-[14px] text-[#3f3d3e] leading-snug">
                Hỗ trợ kỹ thuật &amp; <br /> Tư vấn tận tình 24/7
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#edf8ff] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-[#134377]" />
              </div>
              <span className="text-[14px] text-[#3f3d3e] leading-snug">
                Giao hàng toàn quốc <br /> tất cả các ngày trong tuần
              </span>
            </div>
          </div>
        </div>

        {/* Middle Row: 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-9">
          {/* Col 1: Thông tin */}
          <div>
            <h3 className="font-bold text-[17px] uppercase text-[#134377] mb-4">
              Thông tin
            </h3>
            <div className="space-y-2.5 text-[15px] text-[#134377] font-roboto">
              <p className="leading-relaxed">
                Địa chỉ: Tân Hưng, Thanh Lâm, Ninh Bình, Việt Nam.
              </p>
              <p>Mã số thuế: 0700825567</p>
              <p>Email: xraptor@gmail.com</p>
              <p>Hotline: 0949 331 386</p>
            </div>
            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#facebook"
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook"
                className="w-[34px] h-[34px] rounded-full bg-[#134377] text-white flex items-center justify-center hover:bg-[#0972b6] transition-colors font-bold text-sm"
              >
                f
              </a>
              <a
                href="#youtube"
                onClick={(e) => e.preventDefault()}
                aria-label="YouTube"
                className="w-[34px] h-[34px] rounded-full bg-[#134377] text-white flex items-center justify-center hover:bg-[#0972b6] transition-colors text-xs font-bold"
              >
                ▶
              </a>
              <a
                href="#tiktok"
                onClick={(e) => e.preventDefault()}
                aria-label="TikTok"
                className="w-[34px] h-[34px] rounded-full bg-[#134377] text-white flex items-center justify-center hover:bg-[#0972b6] transition-colors text-xs font-bold"
              >
                ♪
              </a>
            </div>
          </div>

          {/* Col 2: Về Xraptor */}
          <div>
            <h3 className="font-bold text-[17px] uppercase text-[#134377] mb-4">
              Về Xraptor
            </h3>
            <ul className="space-y-2.5 text-[15px] text-[#134377]">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#0972b6] cursor-pointer">
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => document.getElementById('ve-xraptor')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="hover:text-[#0972b6] cursor-pointer"
                >
                  Giới thiệu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('category', { filterCategory: 'Vợt Pickleball' })}
                  className="hover:text-[#0972b6] cursor-pointer"
                >
                  Vợt Pickleball
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('category')} className="hover:text-[#0972b6] cursor-pointer">
                  Phụ kiện Pickleball
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#0972b6] cursor-pointer">
                  Liên hệ
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => document.getElementById('blog-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  className="hover:text-[#0972b6] cursor-pointer"
                >
                  Blog - Tin tức
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#0972b6] cursor-pointer">
                  Kiểm tra đơn hàng
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Thông tin - Chính sách */}
          <div>
            <h3 className="font-bold text-[17px] uppercase text-[#134377] mb-4">
              Thông tin - Chính sách
            </h3>
            <ul className="space-y-2.5 text-[15px] text-[#134377]">
              {[
                'Hướng dẫn mua hàng',
                'Hướng dẫn thanh toán',
                'Phương thức giao nhận',
                'Bảo mật thông tin',
                'Chính sách bảo hành',
                'Chính sách đổi trả và hoàn tiền',
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#policy"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('contact');
                    }}
                    className="hover:text-[#0972b6]"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Fanpage + Bộ Công Thương */}
          <div>
            <h3 className="font-bold text-[17px] uppercase text-[#134377] mb-4">
              Fanpage
            </h3>
            <div className="w-full h-[165px] rounded-[3px] bg-[#f0efef] border border-gray-200 flex flex-col justify-between p-4 mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={BRAND.logo}
                  alt="Xraptor Fanpage"
                  className="w-11 h-11 rounded bg-white p-1 object-contain shadow-sm"
                />
                <div>
                  <p className="font-bold text-[14px] text-[#134377]">Xraptor Pickleball Vietnam</p>
                  <p className="text-[12px] text-gray-500">12.5K người theo dõi</p>
                </div>
              </div>
              <a
                href="#fanpage"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center justify-center gap-2 bg-[#134377] hover:bg-[#0972b6] text-white text-xs font-semibold py-2 px-3 rounded transition-colors w-fit"
              >
                Theo dõi Trang
              </a>
            </div>
            <img
              src={BRAND.dathongbao}
              alt="Đã thông báo Bộ Công Thương"
              className="h-[48px] w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-[#134377] text-white py-3.5 text-center text-[14px]">
        © 2025 Copyright by All rights reserved. Designed by Vicogroup.vn
      </div>
    </footer>
  );
}
