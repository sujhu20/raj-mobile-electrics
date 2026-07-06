import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiShoppingCart, FiHeart, FiUser, FiMenu, FiX,
  FiChevronDown, FiPackage, FiLogOut, FiGrid
} from 'react-icons/fi';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { toggleMobileMenu, setSearchOpen } from '../../store/slices/uiSlice';
import { ROUTES, APP_NAME, ROLES } from '../../config/constants';
import api from '../../config/api';
import Logo from '../common/Logo';

const NAV_CATEGORIES = [
  { label: 'All Products', slug: '', icon: '🛍️' },
  { label: 'Smartphones', slug: 'smartphones', icon: '📱' },
  { label: 'Tablets', slug: 'tablets', icon: '📟' },
  { label: 'Cameras', slug: 'cameras', icon: '📷' },
  { label: 'Earbuds', slug: 'earbuds', icon: '🎧' },
  { label: 'Smart Watches', slug: 'smart-watches', icon: '⌚' },
  { label: 'Speakers', slug: 'speakers', icon: '🔊' },
  { label: 'Power Banks', slug: 'power-banks', icon: '🔋' },
  { label: 'Accessories', slug: 'chargers', icon: '🔌' },
];

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { items: cartItemsRaw } = useAppSelector((s) => s.cart);
  const { items: wishlistItemsRaw } = useAppSelector((s) => s.wishlist);
  const cartItems = Array.isArray(cartItemsRaw) ? cartItemsRaw : [];
  const wishlistItems = Array.isArray(wishlistItemsRaw) ? wishlistItemsRaw : [];
  const { mobileMenuOpen } = useAppSelector((s) => s.ui);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Force light mode on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const { data } = await api.get(`/search/suggestions?q=${searchQuery}`);
          setSuggestions(data.data);
          setShowSuggestions(true);
        } catch { setSuggestions([]); }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 shadow-[0_2px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl'
            : 'bg-white border-b border-slate-100'
        }`}
        style={{ background: scrolled ? 'var(--header-bg)' : undefined }}
      >


        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
              id="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            {/* Logo */}
            <Link to="/" id="logo">
              <Logo size="md" />
            </Link>

            {/* Search bar */}
            <div ref={searchRef} className="flex-1 max-w-2xl relative hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                  id="search-input"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm"
                  aria-label="Search"
                >
                  <FiSearch size={15} />
                </button>
              </form>

              {/* Search suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (s.type === 'product') navigate(`/products/${s.slug}`);
                          else if (s.type === 'category') navigate(`/products?category=${s.slug}`);
                          else navigate(`/products?search=${s.text}`);
                          setShowSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <FiSearch size={13} className="text-primary-600" />
                        </div>
                        <span className="text-slate-700 font-medium flex-1">{s.text}</span>
                        <span className="text-[11px] text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          {s.type}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right action icons */}
            <div className="flex items-center gap-1">
              {/* Mobile search */}
              <button
                onClick={() => dispatch(setSearchOpen(true))}
                className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
                aria-label="Search"
              >
                <FiSearch size={20} />
              </button>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  to={ROUTES.WISHLIST}
                  className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 hover:text-rose-500"
                  id="wishlist-btn"
                  aria-label="Wishlist"
                >
                  <FiHeart size={20} />
                  {wishlistItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold leading-none"
                    >
                      {wishlistItems.length}
                    </motion.span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link
                to={ROUTES.CART}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 hover:text-primary-600"
                id="cart-btn"
                aria-label="Shopping cart"
              >
                <FiShoppingCart size={20} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full gradient-primary text-white text-[10px] flex items-center justify-center font-bold leading-none shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>

              {/* User menu */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative ml-1">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                    id="user-menu-toggle"
                  >
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.firstName}</p>
                      <p className="text-[10px] text-slate-400 leading-tight capitalize">{user?.role}</p>
                    </div>
                    <FiChevronDown
                      size={14}
                      className={`hidden lg:block text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                      >
                        {/* User info header */}
                        <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                              {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          <Link
                            to={ROUTES.PROFILE}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                              <FiUser size={14} className="text-slate-500 group-hover:text-primary-600" />
                            </div>
                            <span className="font-medium">My Profile</span>
                          </Link>
                          <Link
                            to={ROUTES.ORDERS}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                              <FiPackage size={14} className="text-slate-500 group-hover:text-primary-600" />
                            </div>
                            <span className="font-medium">My Orders</span>
                          </Link>
                          <Link
                            to={ROUTES.WISHLIST}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-500 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-rose-50 flex items-center justify-center transition-colors">
                              <FiHeart size={14} className="text-slate-500 group-hover:text-rose-500" />
                            </div>
                            <span className="font-medium">Wishlist</span>
                          </Link>
                          {user?.role === ROLES.ADMIN && (
                            <Link
                              to={ROUTES.ADMIN_DASHBOARD}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                                <FiGrid size={14} className="text-primary-600" />
                              </div>
                              <span className="font-semibold">Admin Panel</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 py-1.5">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 w-full transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                              <FiLogOut size={14} className="text-rose-500" />
                            </div>
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link
                    to={ROUTES.LOGIN}
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                    id="login-btn"
                  >
                    <FiUser size={15} />
                    Login
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl gradient-primary text-white hover:opacity-90 transition-opacity shadow-sm"
                    id="register-btn"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category nav bar */}
        <div className="border-t border-slate-100 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-0.5 py-1 text-sm overflow-x-auto scrollbar-hide">
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={cat.slug ? `/products?category=${cat.slug}` : '/products'}
                  className="px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-all whitespace-nowrap text-slate-600 font-medium flex items-center gap-1.5 text-[13px]"
                >
                  <span className="text-xs">{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <Link
                to="/products?sort=popular"
                className="px-3 py-2 rounded-lg hover:bg-rose-50 transition-all whitespace-nowrap text-rose-600 font-semibold flex items-center gap-1 text-[13px]"
              >
                🔥 Deals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => dispatch(toggleMobileMenu())}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto lg:hidden shadow-2xl"
            >
              {/* Mobile header */}
              <div className="p-5 gradient-primary text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt={APP_NAME} className="w-8 h-8 rounded-lg object-cover" />
                    <span className="font-bold text-lg">{APP_NAME}</span>
                  </div>
                  <button
                    onClick={() => dispatch(toggleMobileMenu())}
                    className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    aria-label="Close menu"
                  >
                    <FiX size={18} />
                  </button>
                </div>
                {isAuthenticated ? (
                  <div className="bg-white/15 rounded-xl p-3">
                    <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-white/70 truncate">{user?.email}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => dispatch(toggleMobileMenu())}
                      className="flex-1 py-2.5 text-center rounded-xl bg-white/20 text-sm font-semibold hover:bg-white/30 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => dispatch(toggleMobileMenu())}
                      className="flex-1 py-2.5 text-center rounded-xl bg-white text-primary-700 text-sm font-semibold hover:bg-primary-50 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile nav */}
              <nav className="p-4 space-y-0.5">
                {[
                  { to: '/', label: 'Home', icon: '🏠' },
                  { to: '/products', label: 'All Products', icon: '🛍️' },
                  { to: '/products?sort=popular', label: 'Best Sellers', icon: '🔥' },
                  { to: '/products?sort=newest', label: 'New Arrivals', icon: '✨' },
                ].map(({ to, label, icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => dispatch(toggleMobileMenu())}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                  </Link>
                ))}

                <div className="pt-3 pb-1">
                  <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Categories
                  </p>
                </div>

                {NAV_CATEGORIES.filter((c) => c.slug).map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/products?category=${cat.slug}`}
                    onClick={() => dispatch(toggleMobileMenu())}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600 hover:text-primary-600"
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="pt-3 pb-1">
                      <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Account
                      </p>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => dispatch(toggleMobileMenu())}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600"
                    >
                      <FiUser size={16} /> My Profile
                    </Link>
                    <Link
                      to={ROUTES.ORDERS}
                      onClick={() => dispatch(toggleMobileMenu())}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600"
                    >
                      <FiPackage size={16} /> My Orders
                    </Link>
                    <button
                      onClick={() => { handleLogout(); dispatch(toggleMobileMenu()); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-colors text-sm text-rose-600 w-full"
                    >
                      <FiLogOut size={16} /> Sign Out
                    </button>
                  </>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
