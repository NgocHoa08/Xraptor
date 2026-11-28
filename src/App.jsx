import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { ArrowUp } from 'lucide-react';
import Header from './components/Header';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { ALL_PRODUCTS, BLOG_POSTS, FEATURED_PADDLES } from './data/siteData';
import { api } from './services/api';

// Lazy-load secondary pages, admin portal & modals
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CartDrawer = lazy(() => import('./components/CartDrawer'));
const OrderTrackingModal = lazy(() => import('./components/OrderTrackingModal'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-9 h-9 rounded-full border-3 border-[#edf8ff] border-t-[#0972b6] animate-spin" />
    </div>
  );
}

function getInitialPage() {
  if (window.location.pathname.startsWith('/admin') || window.location.hash === '#/admin') {
    return 'admin';
  }
  return 'home';
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [products, setProducts] = useState(ALL_PRODUCTS);
  const [blogs, setBlogs] = useState(BLOG_POSTS);
  const [selectedProduct, setSelectedProduct] = useState(FEATURED_PADDLES[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showBackTop, setShowBackTop] = useState(false);

  const loadStoreData = useCallback(async () => {
    try {
      const [prodRes, blogRes] = await Promise.all([api.getProducts(), api.getBlogs()]);
      if (prodRes.products?.length) {
        setProducts(prodRes.products);
        setSelectedProduct((prev) => prodRes.products.find((p) => p.id === prev?.id) || prodRes.products[0]);
      }
      if (blogRes.blogs?.length) {
        setBlogs(blogRes.blogs);
      }
    } catch {
      // Keep bundled fallback data seamlessly if API is offline
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Handle VNPay return redirect query params (?payment_result=success&order=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('payment_result');
    const orderCode = params.get('order');
    if (result) {
      if (result === 'success') {
        showToast(
          `Thanh toán VNPay thành công${orderCode ? ` cho đơn ${orderCode}` : ''}!`
        );
      } else {
        showToast(
          `Thanh toán VNPay chưa hoàn tất${orderCode ? ` (đơn ${orderCode})` : ''}.`
        );
      }
      params.delete('payment_result');
      params.delete('order');
      params.delete('code');
      const nextSearch = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${nextSearch ? '?' + nextSearch : ''}`
      );
    }
  }, [showToast]);

  // Support browser back/forward for /admin vs storefront
  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname.startsWith('/admin')) setActivePage('admin');
      else setActivePage((prev) => (prev === 'admin' ? 'home' : prev));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackTop(window.scrollY > 500);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const handleNavigate = useCallback((page, opts = {}) => {
    setActivePage(page);
    if (page === 'admin') {
      if (!window.location.pathname.startsWith('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
    } else if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
    if (page === 'category') {
      setCategoryFilter(opts.filterCategory || null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setActivePage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCart = useCallback(
    (product, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { product, qty }];
      });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
    },
    [showToast]
  );

  const handleUpdateQty = useCallback((id, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== id));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === id ? { ...i, qty } : i))
      );
    }
  }, []);

  const handleRemoveItem = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const handleOrderSuccess = useCallback(
    (order) => {
      setCart([]);
      loadStoreData();
      showToast(`Đặt hàng thành công! Mã đơn: ${order.order_code}`);
    },
    [loadStoreData, showToast]
  );

  const handleOpenCart = useCallback(() => setCartOpen(true), []);
  const handleCloseCart = useCallback(() => setCartOpen(false), []);

  // Dedicated full-screen Admin Portal
  if (activePage === 'admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminPage
          onExitAdmin={() => handleNavigate('home')}
          onDataMutated={loadStoreData}
        />
      </Suspense>
    );
  }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        cartCount={cartCount}
        onOpenCart={handleOpenCart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main key={activePage} className="flex-1 animate-xr-fade">
        <Suspense fallback={<PageLoader />}>
          {activePage === 'home' && (
            <HomePage
              products={products}
              blogs={blogs}
              onNavigate={handleNavigate}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
            />
          )}
          {activePage === 'category' && (
            <CategoryPage
              products={products}
              initialFilter={categoryFilter}
              searchQuery={searchQuery}
              onNavigate={handleNavigate}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
            />
          )}
          {activePage === 'product' && (
            <ProductDetailPage
              product={selectedProduct}
              products={products}
              onNavigate={handleNavigate}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              onOpenCart={handleOpenCart}
            />
          )}
          {activePage === 'contact' && <ContactPage onNavigate={handleNavigate} />}
        </Suspense>
      </main>

      <Newsletter />
      <Footer
        onNavigate={handleNavigate}
        onOpenTrack={() => setTrackOpen(true)}
        onOpenAdmin={() => handleNavigate('admin')}
      />

      {cartOpen && (
        <Suspense fallback={null}>
          <CartDrawer
            open={cartOpen}
            onClose={handleCloseCart}
            items={cart}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemoveItem}
            onOrderSuccess={handleOrderSuccess}
          />
        </Suspense>
      )}

      {trackOpen && (
        <Suspense fallback={null}>
          <OrderTrackingModal open={trackOpen} onClose={() => setTrackOpen(false)} />
        </Suspense>
      )}

      {/* Floating Back-to-Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
        className={`fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-[#134377] hover:bg-[#0972b6] text-white shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${
          showBackTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#134377] text-white px-5 py-3 rounded-lg shadow-xl border-l-4 border-[#f5dc4a] text-sm font-medium max-w-sm animate-xr-toast">
          {toast}
        </div>
      )}
    </div>
  );
}
