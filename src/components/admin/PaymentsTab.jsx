import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  RotateCcw,
  CreditCard,
  QrCode,
  Truck,
  Wallet,
  Clock,
} from 'lucide-react';
import { formatVND } from '../../data/siteData';

const PAYMENT_STATUSES = [
  'Tất cả',
  'Đã thanh toán',
  'Đang chờ thanh toán',
  'Chưa thanh toán',
  'Thất bại',
  'Đã hoàn tiền',
];

const PAYMENT_METHODS = ['Tất cả', 'COD', 'VIETQR', 'VNPAY'];

const PAY_BADGE = {
  'Đã thanh toán': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Đang chờ thanh toán': 'bg-amber-100 text-amber-800 border-amber-200',
  'Chưa thanh toán': 'bg-gray-100 text-gray-700 border-gray-200',
  'Thất bại': 'bg-rose-100 text-rose-700 border-rose-200',
  'Đã hoàn tiền': 'bg-purple-100 text-purple-800 border-purple-200',
};

const METHOD_ICON = {
  COD: Truck,
  VIETQR: QrCode,
  VNPAY: CreditCard,
};

export default function PaymentsTab({
  payments,
  summary,
  canVerify,
  canRefund,
  onConfirmPayment,
  onRefundPayment,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [methodFilter, setMethodFilter] = useState('Tất cả');

  const filtered = (payments || []).filter((p) => {
    const matchStatus = statusFilter === 'Tất cả' || p.status === statusFilter;
    const matchMethod = methodFilter === 'Tất cả' || p.method === methodFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.transactionCode.toLowerCase().includes(q) ||
      p.orderCode.toLowerCase().includes(q) ||
      (p.gatewayTxnNo || '').toLowerCase().includes(q);
    return matchStatus && matchMethod && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Đã thu thực tế</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {formatVND(summary?.paidAmount || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary?.paidCount || 0} giao dịch thành công</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Đang chờ thanh toán</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {formatVND(summary?.pendingAmount || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary?.pendingCount || 0} giao dịch chờ thu</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Đã hoàn tiền</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-1">
            {formatVND(summary?.refundedAmount || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Chỉ Manager / Super Admin được hoàn</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase">Tổng giao dịch</span>
            <CreditCard className="w-4 h-4 text-[#0972b6]" />
          </div>
          <p className="text-2xl font-bold text-[#134377] mt-1">
            {summary?.totalTransactions || payments.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">COD • VietQR • VNPay Sandbox</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã giao dịch, mã đơn, mã cổng..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#0972b6]"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none cursor-pointer"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m === 'Tất cả' ? 'Tất cả phương thức' : m}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#134377] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Mã giao dịch</th>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Phương thức</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Xác nhận bởi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const Icon = METHOD_ICON[p.method] || CreditCard;
                const canConfirmThis =
                  canVerify &&
                  p.status !== 'Đã thanh toán' &&
                  p.status !== 'Đã hoàn tiền';
                const canRefundThis = canRefund && p.status === 'Đã thanh toán';

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-[#134377]">
                        {p.transactionCode}
                      </p>
                      {p.gatewayTxnNo && (
                        <p className="font-mono text-[11px] text-gray-400">
                          Ref: {p.gatewayTxnNo}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0972b6]">{p.orderCode}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#edf8ff] text-[#134377] text-xs font-bold">
                        <Icon className="w-3.5 h-3.5" />
                        {p.method}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-0.5">{p.provider}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#dd3333]">
                      {formatVND(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          PAY_BADGE[p.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p className="font-medium">{p.confirmedBy || '—'}</p>
                      {p.paidAt && (
                        <p className="text-[11px] text-gray-400">
                          {new Date(p.paidAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {canConfirmThis && (
                          <button
                            onClick={() => onConfirmPayment(p)}
                            className="px-2.5 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Xác nhận đã nhận thanh toán"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận thu</span>
                          </button>
                        )}
                        {canRefundThis && (
                          <button
                            onClick={() => onRefundPayment(p)}
                            className="px-2.5 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Hoàn tiền giao dịch"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Hoàn tiền</span>
                          </button>
                        )}
                        {!canConfirmThis && !canRefundThis && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Không có giao dịch nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
