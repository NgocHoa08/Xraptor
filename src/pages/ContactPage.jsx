import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BRAND } from '../data/siteData';
import { api } from '../services/api';

export default function ContactPage({ onNavigate }) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    orderCode: '',
    subject: '',
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.createContact(form);
      setSent(true);
      setForm({
        fullName: '',
        phone: '',
        email: '',
        orderCode: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err.message || 'Không thể gửi liên hệ lúc này.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Page Hero Banner matching Figma 101:1437 */}
      <section className="relative h-[207px] w-full overflow-hidden">
        <img
          src={BRAND.contactHero}
          alt="Liên hệ với chúng tôi"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/75" />
        <div className="xr-container relative z-10 h-full flex flex-col justify-between py-4">
          <div className="text-white/90 text-[15px] flex items-center gap-1.5">
            <button onClick={() => onNavigate('home')} className="hover:underline cursor-pointer">
              Trang chủ
            </button>
            <span>/</span>
            <span>Liên hệ</span>
          </div>
          <h1 className="font-heading font-bold text-[28px] sm:text-[36px] text-white uppercase pb-6">
            Liên hệ với chúng tôi
          </h1>
        </div>
      </section>

      {/* Split Contact Section matching Figma 101:1420 (full-bleed navy left on desktop) */}
      <section className="relative bg-white">
        <div
          className="hidden lg:block absolute inset-y-0 left-0 w-[46.5%] bg-[#134377] pointer-events-none"
          aria-hidden="true"
        />
        <div className="xr-container relative z-10 grid grid-cols-1 lg:grid-cols-12">
          {/* Left Navy Info Panel */}
          <div className="lg:col-span-5 bg-[#134377] lg:bg-transparent text-white relative overflow-hidden -mx-4 px-6 sm:px-10 lg:mx-0 lg:px-0 lg:pr-10 py-12 min-h-[540px] flex flex-col justify-between">
            <div className="relative z-10">
              <h2 className="font-heading font-bold text-[28px] sm:text-[34px] uppercase mb-3 leading-tight">
                Liên hệ với chúng tôi
              </h2>
              <p className="text-[14px] text-white/90 leading-relaxed mb-8 max-w-[460px]">
                Vui lòng sử dụng biểu mẫu để liên hệ với nhóm dịch vụ khách hàng của chúng tôi. Chúng
                tôi sẽ phản hồi bạn sớm nhất có thể.
              </p>

              <div className="space-y-5 text-[15.5px]">
                <div>
                  <p className="font-bold text-white mb-1">
                    Công ty cổ phần đầu tư và phát triển Hasuko
                  </p>
                  <p className="text-white/90">
                    Địa chỉ: Tân Hưng, Thanh Lâm, Ninh Bình, Việt Nam.
                  </p>
                </div>

                <div>
                  <p className="font-semibold uppercase text-white mb-0.5">Email</p>
                  <p className="text-white/90">ngoimauhasuko123@gmail.com</p>
                </div>

                <div>
                  <p className="font-semibold uppercase text-white mb-0.5">Hotline</p>
                  <p className="text-white/90">0949 331 386</p>
                </div>

                <div>
                  <p className="font-semibold uppercase text-white mb-0.5">Giờ làm việc</p>
                  <p className="text-white/90">Từ thứ 2 đến thứ 6 hàng tuần (8h00 - 18h00)</p>
                  <p className="text-white/80">(Đóng cửa vào các ngày lễ lớn)</p>
                </div>
              </div>
            </div>

            {/* Subtle Watermark Logo matching Figma 211:5712 */}
            <img
              src={BRAND.logo}
              alt=""
              className="absolute -bottom-6 right-4 w-[250px] opacity-15 brightness-0 invert pointer-events-none select-none"
            />
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 bg-white lg:pl-16 py-12">
          <h2 className="font-heading font-bold text-[28px] sm:text-[34px] text-[#134377] uppercase mb-2 leading-tight">
            Nhập thông tin liên hệ
          </h2>
          <p className="text-[14px] text-black mb-8">
            Vui lòng sử dụng biểu mẫu dưới đây để liên hệ với nhóm dịch vụ khách hàng của chúng tôi
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-roboto font-semibold text-[15px] text-black mb-2">
                  Họ và Tên*
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full h-[42px] px-3.5 rounded-[5px] bg-[#f6f6f6] text-[15px] text-black outline-none focus:ring-2 focus:ring-[#0972b6]/40"
                />
              </div>
              <div>
                <label className="block font-roboto font-semibold text-[15px] text-black mb-2">
                  Số điện thoại*
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-[42px] px-3.5 rounded-[5px] bg-[#f6f6f6] text-[15px] text-black outline-none focus:ring-2 focus:ring-[#0972b6]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-[15px] text-black mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-[42px] px-3.5 rounded-[5px] bg-[#f6f6f6] text-[15px] text-black outline-none focus:ring-2 focus:ring-[#0972b6]/40"
                />
              </div>
              <div>
                <label className="block font-semibold text-[15px] text-black mb-2">
                  Mã đơn hàng (nếu có)
                </label>
                <input
                  type="text"
                  value={form.orderCode}
                  onChange={(e) => setForm({ ...form, orderCode: e.target.value })}
                  className="w-full h-[42px] px-3.5 rounded-[5px] bg-[#f6f6f6] text-[15px] text-black outline-none focus:ring-2 focus:ring-[#0972b6]/40"
                />
              </div>
            </div>

            <div>
              <label className="block font-roboto font-semibold text-[15px] text-black mb-2">
                Tiêu đề*
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full h-[42px] px-3.5 rounded-[5px] bg-[#f6f6f6] text-[15px] text-black outline-none focus:ring-2 focus:ring-[#0972b6]/40"
              />
            </div>

            <div>
              <label className="block font-roboto font-semibold text-[15px] text-black mb-2">
                Lời nhắn*
              </label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-3.5 rounded-[5px] bg-[#f6f6f6] text-[15px] text-black outline-none focus:ring-2 focus:ring-[#0972b6]/40 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                {sent && (
                  <p className="text-sm font-medium text-[#0972b6] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.
                  </p>
                )}
                {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={sending}
                className="h-[46px] px-8 rounded-[5px] bg-[#0972b6] hover:bg-[#134377] disabled:opacity-60 text-white font-bold text-[15px] uppercase transition-colors cursor-pointer"
              >
                {sending ? 'Đang gửi...' : 'Gửi ngay'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </section>
    </div>
  );
}
