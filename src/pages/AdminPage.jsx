import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  FileText,
  Mail,
  Settings,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Lock,
  Eye,
  Menu,
} from 'lucide-react';
import { BRAND, formatVND } from '../data/siteData';
import { api, getAdminToken, setAdminToken } from '../services/api';

const ORDER_STATUSES = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
const PRODUCT_CATEGORIES = [
  'Vợt Pickleball',
  'Bóng Pickleball',
  'Giày Pickleball',
  'Lưới Pickleball',
];

const STATUS_BADGE = {
  'Chờ xác nhận': 'bg-amber-100 text-amber-800 border-amber-200',
  'Đang xử lý': 'bg-sky-100 text-sky-800 border-sky-200',
  'Đang giao': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Hoàn thành': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Đã hủy': 'bg-rose-100 text-rose-800 border-rose-200',
  'Chưa xử lý': 'bg-amber-100 text-amber-800 border-amber-200',
  'Đã xử lý': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const EMPTY_PRODUCT = {
  sku: '',
  name: '',
  price: 4000000,
  oldPrice: 5000000,
  stock: 50,
  category: 'Vợt Pickleball',
  subCategory: 'Xraptor 1983 16mm',
  featured: false,
  image: '',
  specs: '',
  description: '',
};

const EMPTY_BLOG = {
  tag: 'Tin tức',
  date: '',
  title: '',
  excerpt: '',
  content: '',
  image: '',
};

export default function AdminPage({ onExitAdmin, onDataMutated }) {
  const [admin, setAdmin] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: 'admin@xraptor.vn', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [subscribers, setSubscribers] = useState([]);

  // Filters
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('Tất cả');
  const [orderStatusFilter, setOrderStatusFilter] = useState('Tất cả');
  const [orderSearch, setOrderSearch] = useState('');

  // Modals
  const [prodModal, setProdModal] = useState(null); // null | { mode: 'create'|'edit', data }
  const [blogModal, setBlogModal] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const showNotice = useCallback((text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3200);
  }, []);

  // Verify session on mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    api
      .me()
      .then((res) => setAdmin(res.admin))
      .catch(() => setAdminToken(''))
      .finally(() => setCheckingAuth(false));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, ordRes, conRes, blogRes, subRes] = await Promise.all([
        api.getDashboard(),
        api.getProducts(),
        api.getOrders(),
        api.getContacts(),
        api.getBlogs(),
        api.getSubscribers(),
      ]);
      setDashboard(dashRes);
      setProducts(prodRes.products || []);
      setOrders(ordRes.orders || []);
      setContacts(conRes.contacts || []);
      setBlogs(blogRes.blogs || []);
      setSubscribers(subRes.subscribers || []);
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    if (admin) fetchAll();
  }, [admin, fetchAll]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await api.login(loginForm.email, loginForm.password);
      setAdminToken(res.token);
      setAdmin(res.admin);
    } catch (err) {
      setLoginError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminToken('');
    setAdmin(null);
    setLoginForm({ email: 'admin@xraptor.vn', password: '' });
  };

  // Upload image helper
  const handleFileUpload = async (file, onUrl) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      onUrl(res.url);
      showNotice('Tải ảnh lên thành công!');
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Product CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (prodModal.mode === 'create') {
        await api.createProduct(prodModal.data);
        showNotice('Đã thêm sản phẩm mới!');
      } else {
        await api.updateProduct(prodModal.data.id, prodModal.data);
        showNotice('Đã cập nhật sản phẩm!');
      }
      setProdModal(null);
      await fetchAll();
      onDataMutated?.();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (p) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await api.deleteProduct(p.id);
      showNotice('Đã xóa sản phẩm.');
      await fetchAll();
      onDataMutated?.();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  // Order status update
  const handleOrderStatus = async (orderId, status) => {
    try {
      const res = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      if (orderDetail?.id === orderId) setOrderDetail(res.order);
      api.getDashboard().then(setDashboard).catch(() => {});
      showNotice(`Đã chuyển trạng thái đơn hàng thành "${status}".`);
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Xóa đơn hàng ${order.order_code}?`)) return;
    try {
      await api.deleteOrder(order.id);
      showNotice('Đã xóa đơn hàng.');
      setOrderDetail(null);
      await fetchAll();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  // Contact actions
  const handleToggleContact = async (c) => {
    const next = c.status === 'Đã xử lý' ? 'Chưa xử lý' : 'Đã xử lý';
    try {
      const res = await api.updateContactStatus(c.id, next);
      setContacts((prev) => prev.map((item) => (item.id === c.id ? res.contact : item)));
      api.getDashboard().then(setDashboard).catch(() => {});
      showNotice(`Đã đánh dấu liên hệ: ${next}`);
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleDeleteContact = async (c) => {
    if (!window.confirm(`Xóa liên hệ từ "${c.full_name}"?`)) return;
    try {
      await api.deleteContact(c.id);
      showNotice('Đã xóa liên hệ.');
      await fetchAll();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  // Blog CRUD
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    try {
      if (blogModal.mode === 'create') {
        await api.createBlog(blogModal.data);
        showNotice('Đã đăng bài viết mới!');
      } else {
        await api.updateBlog(blogModal.data.id, blogModal.data);
        showNotice('Đã cập nhật bài viết!');
      }
      setBlogModal(null);
      await fetchAll();
      onDataMutated?.();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  const handleDeleteBlog = async (b) => {
    if (!window.confirm(`Xóa bài viết "${b.title}"?`)) return;
    try {
      await api.deleteBlog(b.id);
      showNotice('Đã xóa bài viết.');
      await fetchAll();
      onDataMutated?.();
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  // Export subscribers CSV
  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Email', 'Ngày đăng ký'],
      ...subscribers.map((s) => [s.id, s.email, s.created_at]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xraptor-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      showNotice('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    try {
      await api.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      showNotice('Đổi mật khẩu quản trị thành công!');
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  // ======================== LOADING / LOGIN SCREEN ========================
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#edf8ff] border-t-[#134377] animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e325c] via-[#134377] to-[#0972b6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <img src={BRAND.logo} alt="Xraptor" className="h-14 mx-auto object-contain" />
            <h1 className="font-heading text-2xl font-bold text-[#134377] uppercase">
              Xraptor Admin
            </h1>
            <p className="text-sm text-gray-500">Hệ thống quản trị sản phẩm, đơn hàng &amp; nội dung</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email quản trị</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#0972b6] focus:ring-2 focus:ring-[#0972b6]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Nhập mật khẩu..."
                className="w-full h-11 px-3.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#0972b6] focus:ring-2 focus:ring-[#0972b6]/20"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full h-11 rounded-lg bg-[#134377] hover:bg-[#0972b6] disabled:opacity-60 text-white font-bold text-sm uppercase transition-colors cursor-pointer"
            >
              {loggingIn ? 'Đang đăng nhập...' : 'Đăng nhập quản trị'}
            </button>
          </form>

          <div className="bg-[#edf8ff] rounded-lg p-3.5 text-xs text-[#134377] space-y-1">
            <p className="font-bold">Tài khoản mặc định:</p>
            <p>
              Email: <code className="font-mono bg-white px-1.5 py-0.5 rounded">admin@xraptor.vn</code>
            </p>
            <p>
              Mật khẩu: <code className="font-mono bg-white px-1.5 py-0.5 rounded">admin123</code>
            </p>
          </div>

          <button
            onClick={onExitAdmin}
            className="w-full text-center text-sm text-gray-500 hover:text-[#0972b6] font-medium cursor-pointer"
          >
            ← Quay lại trang cửa hàng Xraptor
          </button>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchCat = prodCatFilter === 'Tất cả' || p.category === prodCatFilter;
    const q = prodSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const filteredOrders = orders.filter((o) => {
    const matchSt = orderStatusFilter === 'Tất cả' || o.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      o.order_code.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.includes(q);
    return matchSt && matchQ;
  });

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'products', label: 'Sản phẩm', icon: Package, badge: products.length },
    {
      id: 'orders',
      label: 'Đơn hàng',
      icon: ShoppingCart,
      badge: dashboard?.kpis?.pendingOrders || 0,
      highlight: (dashboard?.kpis?.pendingOrders || 0) > 0,
    },
    {
      id: 'contacts',
      label: 'Liên hệ',
      icon: MessageSquare,
      badge: dashboard?.kpis?.unreadContacts || 0,
      highlight: (dashboard?.kpis?.unreadContacts || 0) > 0,
    },
    { id: 'blogs', label: 'Blog - Tin tức', icon: FileText, badge: blogs.length },
    { id: 'subscribers', label: 'Khách đăng ký', icon: Mail, badge: subscribers.length },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex text-[#27272a]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#134377] text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 h-[72px] flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logo}
              alt="Xraptor"
              className="h-10 w-auto bg-white rounded p-1 object-contain"
            />
            <div>
              <p className="font-heading font-bold text-base tracking-wide">XRAPTOR</p>
              <p className="text-[11px] text-[#f5dc4a] font-semibold uppercase">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0972b6] text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.highlight
                        ? 'bg-[#f5dc4a] text-black'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-2 py-1 text-xs text-white/75 truncate">
            <p className="font-bold text-white truncate">{admin.name}</p>
            <p className="truncate">{admin.email}</p>
          </div>
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Xem Website</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[72px] bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-[#134377]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold text-lg sm:text-xl text-[#134377] uppercase">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
            {dashboard?.database && (
              <span
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  dashboard.database === 'supabase'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dashboard.database === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {dashboard.database === 'supabase' ? 'Supabase PostgreSQL' : 'Local SQLite'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="h-9 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
            <button
              onClick={onExitAdmin}
              className="h-9 px-3.5 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Cửa hàng</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden">
          {/* ======================== TAB: DASHBOARD ======================== */}
          {tab === 'dashboard' && dashboard && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
                  <p className="text-xs font-semibold uppercase text-gray-500">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-[#134377] mt-1">
                    {formatVND(dashboard.kpis.totalRevenue)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                    {dashboard.kpis.completedOrders} đơn đã hoàn thành
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
                  <p className="text-xs font-semibold uppercase text-gray-500">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-[#0972b6] mt-1">
                    {dashboard.kpis.totalOrders}
                  </p>
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">
                    {dashboard.kpis.pendingOrders} đơn chờ xác nhận
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
                  <p className="text-xs font-semibold uppercase text-gray-500">Sản phẩm đang bán</p>
                  <p className="text-2xl font-bold text-black mt-1">
                    {dashboard.kpis.totalProducts}
                  </p>
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">
                    {dashboard.kpis.lowStockCount} sản phẩm sắp hết hàng (≤10)
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Liên hệ &amp; Đăng ký tin
                  </p>
                  <p className="text-2xl font-bold text-[#2a879e] mt-1">
                    {dashboard.kpis.unreadContacts}{' '}
                    <span className="text-sm font-normal text-gray-500">chưa xử lý</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    {dashboard.kpis.totalSubscribers} email nhận bản tin
                  </p>
                </div>
              </div>

              {/* Category Breakdown + Low Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-gray-200">
                  <h2 className="font-bold text-base text-[#134377] mb-4">
                    Phân bổ kho hàng theo danh mục
                  </h2>
                  <div className="space-y-4">
                    {(dashboard.byCategory || []).map((cat) => {
                      const maxStock = Math.max(
                        ...dashboard.byCategory.map((c) => c.totalStock),
                        1
                      );
                      const pct = Math.round((cat.totalStock / maxStock) * 100);
                      return (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold">{cat.category}</span>
                            <span className="text-gray-500">
                              {cat.productCount} mẫu • <strong>{cat.totalStock}</strong> tồn kho
                            </span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#134377] to-[#0972b6] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-base text-[#134377] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Sắp hết hàng
                    </h2>
                    <button
                      onClick={() => setTab('products')}
                      className="text-xs text-[#0972b6] hover:underline font-semibold cursor-pointer"
                    >
                      Quản lý kho →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(dashboard.lowStockProducts || []).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 text-sm pb-2.5 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image}
                            alt=""
                            className="w-9 h-9 rounded bg-gray-50 object-contain p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.sku}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-xs shrink-0">
                          Còn {p.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-base text-[#134377]">Đơn hàng mới nhất</h2>
                  <button
                    onClick={() => setTab('orders')}
                    className="text-xs text-[#0972b6] hover:underline font-semibold cursor-pointer"
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Mã đơn</th>
                        <th className="px-5 py-3">Khách hàng</th>
                        <th className="px-5 py-3">Thanh toán</th>
                        <th className="px-5 py-3">Tổng tiền</th>
                        <th className="px-5 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(dashboard.recentOrders || []).map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-bold text-[#134377]">{o.order_code}</td>
                          <td className="px-5 py-3">
                            <p className="font-medium">{o.customer_name}</p>
                            <p className="text-xs text-gray-400">{o.phone}</p>
                          </td>
                          <td className="px-5 py-3 text-xs">{o.payment_method}</td>
                          <td className="px-5 py-3 font-bold text-[#dd3333]">
                            {formatVND(o.total_amount)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                STATUS_BADGE[o.status] || 'bg-gray-100'
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ======================== TAB: PRODUCTS ======================== */}
          {tab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      placeholder="Tìm theo tên hoặc mã SKU..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#0972b6]"
                    />
                  </div>
                  <select
                    value={prodCatFilter}
                    onChange={(e) => setProdCatFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm outline-none cursor-pointer"
                  >
                    <option value="Tất cả">Tất cả danh mục</option>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setProdModal({ mode: 'create', data: { ...EMPTY_PRODUCT } })}
                  className="h-10 px-4 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm sản phẩm</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Danh mục</th>
                        <th className="px-4 py-3">Giá bán</th>
                        <th className="px-4 py-3">Tồn kho</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 object-contain p-1 shrink-0"
                              />
                              <div className="max-w-[280px]">
                                <p className="font-semibold text-black line-clamp-1">{p.name}</p>
                                {p.featured && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#f5dc4a] text-black text-[10px] font-bold">
                                    Nổi bật
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-[#edf8ff] text-[#134377] text-xs font-medium">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#dd3333]">{formatVND(p.price)}</p>
                            {p.oldPrice > 0 && (
                              <p className="text-xs text-gray-400 line-through">
                                {formatVND(p.oldPrice)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-bold text-xs px-2 py-0.5 rounded ${
                                p.stock <= 10
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setProdModal({ mode: 'edit', data: { ...p } })}
                                className="p-2 rounded-lg text-[#0972b6] hover:bg-[#edf8ff] cursor-pointer"
                                title="Sửa"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================== TAB: ORDERS ======================== */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Tìm mã đơn, tên khách, SĐT..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-[#0972b6]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Tất cả', ...ORDER_STATUSES].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-[#134377] text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Mã đơn</th>
                        <th className="px-4 py-3">Khách hàng</th>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3">Tổng tiền</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-[#134377]">{o.order_code}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{o.customer_name}</p>
                            <p className="text-xs text-gray-500">{o.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {(o.items || []).reduce((s, i) => s + i.qty, 0)} sản phẩm (
                            {o.payment_method})
                          </td>
                          <td className="px-4 py-3 font-bold text-[#dd3333]">
                            {formatVND(o.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                                STATUS_BADGE[o.status] || 'bg-gray-100'
                              }`}
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st} className="bg-white text-black">
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setOrderDetail(o)}
                              className="p-2 rounded-lg text-[#0972b6] hover:bg-[#edf8ff] cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o)}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================== TAB: CONTACTS ======================== */}
          {tab === 'contacts' && (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl p-5 border border-gray-200 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-[#134377]">{c.subject}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          STATUS_BADGE[c.status]
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      <strong>{c.full_name}</strong> • {c.phone}
                      {c.email && ` • ${c.email}`}
                      {c.order_code && ` • Mã đơn: ${c.order_code}`}
                    </p>
                    <p className="text-sm text-gray-800 pt-1 leading-relaxed">{c.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleContact(c)}
                      className="px-3 h-9 rounded-lg border border-[#0972b6] text-[#0972b6] hover:bg-[#edf8ff] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{c.status === 'Đã xử lý' ? 'Đánh dấu chưa xử lý' : 'Đã xử lý'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteContact(c)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && (
                <p className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                  Chưa có liên hệ nào.
                </p>
              )}
            </div>
          )}

          {/* ======================== TAB: BLOGS ======================== */}
          {tab === 'blogs' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setBlogModal({ mode: 'create', data: { ...EMPTY_BLOG } })}
                  className="h-10 px-4 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng bài viết</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {blogs.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
                  >
                    <img src={b.image} alt={b.title} className="w-full h-44 object-cover" />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#f5dc4a] text-black text-xs font-bold">
                            {b.tag}
                          </span>
                          <span className="text-xs text-gray-500">{b.date}</span>
                        </div>
                        <h3 className="font-bold text-sm text-[#134377] line-clamp-2">{b.title}</h3>
                        {b.excerpt && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{b.excerpt}</p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => setBlogModal({ mode: 'edit', data: { ...b } })}
                          className="px-3 py-1.5 rounded bg-[#edf8ff] text-[#0972b6] text-xs font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(b)}
                          className="px-3 py-1.5 rounded bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================== TAB: SUBSCRIBERS ======================== */}
          {tab === 'subscribers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Tổng cộng <strong>{subscribers.length}</strong> email đã đăng ký nhận tin.
                </p>
                <button
                  onClick={handleExportCSV}
                  className="h-9 px-4 rounded-lg bg-[#134377] hover:bg-[#0972b6] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất file CSV</span>
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Ngày đăng ký</th>
                      <th className="px-5 py-3 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-400">{s.id}</td>
                        <td className="px-5 py-3 font-medium text-[#134377]">{s.email}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{s.created_at}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={async () => {
                              await api.deleteSubscriber(s.id);
                              fetchAll();
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================== TAB: SETTINGS ======================== */}
          {tab === 'settings' && (
            <div className="max-w-lg bg-white rounded-xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#edf8ff] text-[#134377] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-[#134377]">Đổi mật khẩu quản trị</h2>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Nhập lại mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-lg bg-[#134377] hover:bg-[#0972b6] text-white text-sm font-bold cursor-pointer"
                >
                  Cập nhật mật khẩu
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ======================== PRODUCT MODAL ======================== */}
      {prodModal && (
        <div
          onClick={() => setProdModal(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="px-6 py-4 bg-[#134377] text-white flex items-center justify-between sticky top-0">
              <h3 className="font-heading font-bold text-lg uppercase">
                {prodModal.mode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
              </h3>
              <button onClick={() => setProdModal(null)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodModal.data.name}
                    onChange={(e) =>
                      setProdModal({ ...prodModal, data: { ...prodModal.data, name: e.target.value } })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Mã SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodModal.data.sku}
                    onChange={(e) =>
                      setProdModal({ ...prodModal, data: { ...prodModal.data, sku: e.target.value } })
                    }
                    placeholder="XR-1983-16"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Giá bán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodModal.data.price}
                    onChange={(e) =>
                      setProdModal({
                        ...prodModal,
                        data: { ...prodModal.data, price: Number(e.target.value) },
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Giá niêm yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodModal.data.oldPrice}
                    onChange={(e) =>
                      setProdModal({
                        ...prodModal,
                        data: { ...prodModal.data, oldPrice: Number(e.target.value) },
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Tồn kho *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodModal.data.stock}
                    onChange={(e) =>
                      setProdModal({
                        ...prodModal,
                        data: { ...prodModal.data, stock: Number(e.target.value) },
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Danh mục *
                  </label>
                  <select
                    value={prodModal.data.category}
                    onChange={(e) =>
                      setProdModal({
                        ...prodModal,
                        data: { ...prodModal.data, category: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Dòng sản phẩm (Sub-category)
                  </label>
                  <input
                    type="text"
                    value={prodModal.data.subCategory}
                    onChange={(e) =>
                      setProdModal({
                        ...prodModal,
                        data: { ...prodModal.data, subCategory: e.target.value },
                      })
                    }
                    placeholder="Xraptor 1983 16mm"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              {/* Image URL + File Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Hình ảnh sản phẩm *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={prodModal.data.image}
                    onChange={(e) =>
                      setProdModal({
                        ...prodModal,
                        data: { ...prodModal.data, image: e.target.value },
                      })
                    }
                    placeholder="/images/... hoặc https://..."
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                  <label className="h-10 px-3.5 rounded-lg bg-[#edf8ff] hover:bg-[#dceeff] text-[#134377] text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Đang tải...' : 'Tải ảnh'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e.target.files?.[0], (url) =>
                          setProdModal((m) => ({ ...m, data: { ...m.data, image: url } }))
                        )
                      }
                    />
                  </label>
                </div>
                {prodModal.data.image && (
                  <img
                    src={prodModal.data.image}
                    alt="Preview"
                    className="mt-2 h-24 w-24 object-contain rounded border bg-gray-50 p-1"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Thông số kỹ thuật (mỗi dòng 1 thông số)
                </label>
                <textarea
                  rows={3}
                  value={prodModal.data.specs}
                  onChange={(e) =>
                    setProdModal({ ...prodModal, data: { ...prodModal.data, specs: e.target.value } })
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={prodModal.data.description}
                  onChange={(e) =>
                    setProdModal({
                      ...prodModal,
                      data: { ...prodModal.data, description: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(prodModal.data.featured)}
                  onChange={(e) =>
                    setProdModal({
                      ...prodModal,
                      data: { ...prodModal.data, featured: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-[#134377]"
                />
                <span>Hiển thị trong mục “Sản phẩm nổi bật” trên Trang chủ</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setProdModal(null)}
                  className="h-10 px-5 rounded-lg border border-gray-300 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white text-sm font-bold cursor-pointer"
                >
                  {prodModal.mode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== BLOG MODAL ======================== */}
      {blogModal && (
        <div
          onClick={() => setBlogModal(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="px-6 py-4 bg-[#134377] text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg uppercase">
                {blogModal.mode === 'create' ? 'Đăng bài viết mới' : 'Chỉnh sửa bài viết'}
              </h3>
              <button onClick={() => setBlogModal(null)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBlog} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Nhãn</label>
                  <input
                    type="text"
                    value={blogModal.data.tag}
                    onChange={(e) =>
                      setBlogModal({ ...blogModal, data: { ...blogModal.data, tag: e.target.value } })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Ngày đăng
                  </label>
                  <input
                    type="text"
                    value={blogModal.data.date}
                    onChange={(e) =>
                      setBlogModal({ ...blogModal, data: { ...blogModal.data, date: e.target.value } })
                    }
                    placeholder="25 tháng 11, 2026"
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Tiêu đề bài viết *
                </label>
                <input
                  type="text"
                  required
                  value={blogModal.data.title}
                  onChange={(e) =>
                    setBlogModal({ ...blogModal, data: { ...blogModal.data, title: e.target.value } })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Ảnh bìa *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={blogModal.data.image}
                    onChange={(e) =>
                      setBlogModal({ ...blogModal, data: { ...blogModal.data, image: e.target.value } })
                    }
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm"
                  />
                  <label className="h-10 px-3.5 rounded-lg bg-[#edf8ff] text-[#134377] text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Tải ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e.target.files?.[0], (url) =>
                          setBlogModal((m) => ({ ...m, data: { ...m.data, image: url } }))
                        )
                      }
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  value={blogModal.data.excerpt}
                  onChange={(e) =>
                    setBlogModal({
                      ...blogModal,
                      data: { ...blogModal.data, excerpt: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={4}
                  value={blogModal.data.content}
                  onChange={(e) =>
                    setBlogModal({
                      ...blogModal,
                      data: { ...blogModal.data, content: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setBlogModal(null)}
                  className="h-10 px-5 rounded-lg border border-gray-300 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-lg bg-[#0972b6] hover:bg-[#134377] text-white text-sm font-bold cursor-pointer"
                >
                  Lưu bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================== ORDER DETAIL MODAL ======================== */}
      {orderDetail && (
        <div
          onClick={() => setOrderDetail(null)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 bg-[#134377] text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg uppercase">
                Chi tiết đơn {orderDetail.order_code}
              </h3>
              <button onClick={() => setOrderDetail(null)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Khách hàng</p>
                  <p className="font-bold">{orderDetail.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Số điện thoại</p>
                  <p className="font-bold">{orderDetail.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Địa chỉ giao hàng</p>
                  <p>{orderDetail.address}</p>
                </div>
                {orderDetail.note && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Ghi chú</p>
                    <p className="italic text-gray-700">{orderDetail.note}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <p className="font-bold text-xs uppercase text-gray-500">Danh sách sản phẩm</p>
                {(orderDetail.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt=""
                          className="w-10 h-10 rounded bg-gray-50 object-contain p-0.5 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatVND(item.price)} × {item.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold shrink-0">{formatVND(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold">Tổng thanh toán ({orderDetail.payment_method}):</span>
                <span className="text-lg font-bold text-[#dd3333]">
                  {formatVND(orderDetail.total_amount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t">
                <span className="text-xs font-semibold text-gray-600">Cập nhật trạng thái:</span>
                <select
                  value={orderDetail.status}
                  onChange={(e) => handleOrderStatus(orderDetail.id, e.target.value)}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-xs font-bold cursor-pointer"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-medium animate-xr-toast ${
            notice.type === 'error' ? 'bg-rose-600' : 'bg-[#134377] border-l-4 border-[#f5dc4a]'
          }`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
