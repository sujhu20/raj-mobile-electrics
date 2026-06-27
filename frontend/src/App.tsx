import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { useAppDispatch } from './store/hooks';
import { fetchProfile } from './store/slices/authSlice';
import { fetchCart } from './store/slices/cartSlice';
import { fetchWishlist } from './store/slices/wishlistSlice';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import { AuthGuard, GuestGuard, AdminGuard } from './guards/Guards';
import { STORAGE_KEYS } from './config/constants';

// ============================================================================
// Lazy-loaded pages — Customer
// ============================================================================
const HomePage = lazy(() => import('./pages/customer/HomePage'));
const ProductListPage = lazy(() => import('./pages/customer/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const SearchPage = lazy(() => import('./pages/customer/SearchPage'));

// ============================================================================
// Lazy-loaded pages — Auth
// ============================================================================
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// ============================================================================
// Lazy-loaded pages — Admin
// ============================================================================
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));

// ============================================================================
// Error pages
// ============================================================================
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));

// ============================================================================
// Loading spinner
// ============================================================================
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.jpg" alt="Raj Mobile & Electrics" className="w-16 h-16 rounded-2xl object-cover animate-pulse" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-surface-700/50">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// App initializer — fetch user profile, cart, wishlist on startup
// ============================================================================
function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      dispatch(fetchProfile());
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch]);

  return <>{children}</>;
}

// ============================================================================
// Routes — Customer Layout + Admin Layout are SEPARATE
// ============================================================================
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ================================================================ */}
        {/* CUSTOMER LAYOUT — Header + Footer                               */}
        {/* ================================================================ */}
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Auth (guest only) */}
          <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
          <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />

          {/* Customer (authenticated) */}
          <Route path="/cart" element={<AuthGuard><CartPage /></AuthGuard>} />
          <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />
          <Route path="/wishlist" element={<AuthGuard><WishlistPage /></AuthGuard>} />
          <Route path="/orders" element={<AuthGuard><OrdersPage /></AuthGuard>} />
          <Route path="/orders/:id" element={<AuthGuard><OrderDetailPage /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />

          {/* 404 for customer routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ================================================================ */}
        {/* ADMIN LAYOUT — Sidebar + Topbar (NO Header/Footer)              */}
        {/* ================================================================ */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          {/* /admin → redirect to /admin/dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

// ============================================================================
// App Root
// ============================================================================
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppInitializer>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              },
            }}
          />
        </AppInitializer>
      </BrowserRouter>
    </Provider>
  );
}
