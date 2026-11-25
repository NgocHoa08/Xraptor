import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { BRAND } from '../data/siteData';
import { api } from '../services/api';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.subscribe(email.trim());
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || 'Không thể đăng ký lúc này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-[#edf8ff] overflow-hidden">
      <div className="max-w-[1440px] mx-auto relative min-h-[155px] flex items-center">
        <div className="xr-container w-full py-6 relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="w-full max-w-[590px] lg:max-w-[56%]">
            <h2 className="font-heading text-[22px] sm:text-[24px] text-[#134377] uppercase tracking-wide mb-1">
              Đăng ký để nhận thông tin
            </h2>
            <p className="text-[15px] text-[#134377] mb-3.5">
              Theo dõi để không bỏ lỡ tin tức và sản phẩm mới từ chúng tôi.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 max-w-[434px]">
                <Mail className="w-4 h-4 text-[#134377] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email để nhận thông báo"
                  className="w-full h-[50px] pl-10 pr-4 rounded-[5px] bg-[#f6f6f6] border border-[#6fadd5] text-[15px] text-[#134377] placeholder-[#134377]/70 outline-none focus:ring-2 focus:ring-[#0972b6]/40"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-[50px] px-8 rounded-[5px] bg-[#0972b6] hover:bg-[#134377] disabled:opacity-60 text-white font-semibold text-[16px] transition-colors cursor-pointer shrink-0"
              >
                {loading ? 'Đang gửi...' : 'Đăng ký'}
              </button>
            </form>
            {submitted && (
              <p className="mt-2 text-sm text-[#0972b6] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Đăng ký nhận thông báo thành công!
              </p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        {/* Right decorative collage image matching Figma aff 1 (889, 551x155) */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[38.3%] max-w-[551px] pointer-events-none">
          <img
            src={BRAND.newsletterBanner}
            alt="Xraptor Pickleball Community"
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
