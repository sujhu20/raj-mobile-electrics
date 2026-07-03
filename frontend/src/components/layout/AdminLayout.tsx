import { useState, useEffect, useCallback, memo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiShoppingBag, FiLogOut, FiChevronLeft,
  FiMenu, FiBell, FiChevronDown, FiX,
} from 'react-icons/fi';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { APP_NAME, ROUTES, STORAGE_KEYS } from '../../config/constants';
import { adminNavigation } from '../../config/navigation';
import { usePermissions } from '../../hooks/usePermissions';
import { ErrorBoundary } from '../ui/ErrorBoundary';

// ============================================================================
// Constants
// ============================================================================
const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 68;

// ============================================================================
// Hook: detect desktop (lg breakpoint = 1024px)
// ============================================================================
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
}

// ============================================================================
// Admin Sidebar — Premium Light Theme
// ============================================================================
const AdminSidebar = memo(function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}) {
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { hasPermission } = usePermissions();
  const showLabels = mobileOpen || !collapsed;

  const isActive = (path: string) => {
    if (path === ROUTES.ADMIN_DASHBOARD)
      return location.pathname === ROUTES.ADMIN_DASHBOARD || location.pathname === ROUTES.ADMIN;
    return location.pathname.startsWith(path);
  };

  const sidebarVisible = isDesktop || mobileOpen;
  const visibleItems = adminNavigation.filter((item) => hasPermission(item.permission));

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — white bg, dark text */}
      <aside
        style={{
          width: isDesktop ? (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH) : SIDEBAR_WIDTH,
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-300"
        role="navigation"
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt={APP_NAME} className="w-9 h-9 rounded-xl object-cover shrink-0" />
            {showLabels && (
              <span className="text-base font-bold text-slate-800 whitespace-nowrap leading-tight">
                {APP_NAME}
              </span>
            )}
          </div>
          {!isDesktop && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-600"
              aria-label="Close navigation"
            >
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Admin menu">
          {visibleItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={collapsed && isDesktop ? item.title : undefined}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-blue-700' : 'text-slate-500'}`}
                />
                {showLabels && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        {isDesktop && (
          <div className="px-2 py-3 border-t border-slate-100">
            <button
              onClick={onToggle}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <FiChevronLeft size={18} className={`shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
});

// ============================================================================
// Admin Topbar — Premium Light Theme
// ============================================================================
const AdminTopbar = memo(function AdminTopbar({
  sidebarOffset,
  onMenuClick,
}: {
  sidebarOffset: number;
  onMenuClick: () => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [showMenu, setShowMenu] = useState(false);
  const isDesktop = useIsDesktop();

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate(ROUTES.LOGIN);
  }, [dispatch, navigate]);

  return (
    <header
      style={{ left: isDesktop ? sidebarOffset : 0 }}
      className="fixed top-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4 sm:px-6 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        {!isDesktop && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-1 rounded-lg hover:bg-slate-100 transition text-slate-700"
            aria-label="Open navigation menu"
          >
            <FiMenu size={20} />
          </button>
        )}
        <h2 className="text-base font-semibold text-slate-800">Admin Panel</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to={ROUTES.HOME}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
        >
          🛍️ Visit Store
        </Link>

        <button
          className="relative p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition"
            aria-expanded={showMenu}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-slate-500 leading-tight">Administrator</p>
            </div>
            <FiChevronDown size={14} className="hidden md:block text-slate-400" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} aria-hidden="true" />
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
                  role="menu"
                >
                  {/* User header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link to={ROUTES.ADMIN_DASHBOARD} onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition" role="menuitem">
                    <FiGrid size={15} className="text-slate-500" /> Dashboard
                  </Link>
                  <Link to={ROUTES.HOME} onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition" role="menuitem">
                    <FiShoppingBag size={15} className="text-slate-500" /> Visit Store
                  </Link>
                  <div className="border-t border-slate-100" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition" role="menuitem">
                    <FiLogOut size={15} /> Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
});

// ============================================================================
// Admin Layout
// ============================================================================
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDesktop = useIsDesktop();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Persist sidebar state
  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next)); } catch (e) { console.warn(e); }
      return next;
    });
  }, []);

  const sidebarOffset = isDesktop ? (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        onMobileClose={() => setMobileOpen(false)}
      />
      <AdminTopbar sidebarOffset={sidebarOffset} onMenuClick={() => setMobileOpen(true)} />
      <main
        style={{ marginLeft: sidebarOffset }}
        className="pt-16 min-h-screen transition-all duration-300"
      >
        <div className="p-4 sm:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
