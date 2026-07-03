import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight, FiStar, FiShoppingCart, FiHeart, FiTruck, FiShield, FiHeadphones, FiRefreshCw } from 'react-icons/fi';
import api from '../../config/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { CURRENCY, APP_NAME, CATEGORY_ICONS } from '../../config/constants';

function ProductCard({ product, index }: { product: any; index: number }) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((s) => s.wishlist.items);
  const isWishlisted = wishlistItems.some((i) => i.productId === product.id);
  const image = product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product';
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-2xl border border-surface-200/60 overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-square bg-surface-50 p-4 overflow-hidden">
        {discount > 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-danger-500 text-white text-xs font-bold rounded-lg z-10">
            -{discount}%
          </span>
        )}
        <button
          onClick={() => dispatch(toggleWishlist(product.id))}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition z-10 ${
            isWishlisted ? 'bg-danger-500 text-white' : 'bg-white/80 text-surface-700 hover:bg-danger-500 hover:text-white'
          } shadow-sm`}
        >
          <FiHeart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/products/${product.slug}`}>
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
      </div>
      <div className="p-4">
        <Link to={`/products/${product.slug}`}>
          <p className="text-xs text-primary-600 font-medium mb-1">{product.brand}</p>
          <h3 className="font-semibold text-sm text-surface-900 line-clamp-2 hover:text-primary-600 transition leading-snug">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                size={12}
                className={i < Math.floor(product.avgRating) ? 'text-warning-500 fill-warning-500' : 'text-surface-200'}
              />
            ))}
          </div>
          <span className="text-xs text-surface-700/50">({product.reviewCount})</span>
        </div>
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-surface-900">{CURRENCY} {Number(product.price).toLocaleString()}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-surface-700/40 line-through ml-1.5">
                {CURRENCY} {Number(product.compareAtPrice).toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch(addToCart({ productId: product.id }))}
            disabled={product.stock === 0}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              product.stock === 0
                ? 'bg-surface-100 text-surface-700/30 cursor-not-allowed'
                : 'gradient-primary text-white hover:opacity-90 shadow-sm'
            }`}
          >
            <FiShoppingCart size={15} />
          </button>
        </div>
        {product.stock === 0 && <p className="text-xs text-danger-500 font-medium mt-1">Out of Stock</p>}
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-warning-600 font-medium mt-1">Only {product.stock} left!</p>
        )}
      </div>
    </motion.div>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">{title}</h2>
        {subtitle && <p className="text-surface-700/60 text-sm mt-1">{subtitle}</p>}
      </div>
      {href && (
        <Link to={href} className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
          View All <FiChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [topSelling, setTopSelling] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [_banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [f, l, t, b, c] = await Promise.all([
          api.get('/products/featured').catch(() => ({ data: { data: [] } })),
          api.get('/products/latest').catch(() => ({ data: { data: [] } })),
          api.get('/products/top-selling').catch(() => ({ data: { data: [] } })),
          api.get('/banners').catch(() => ({ data: { data: [] } })),
          api.get('/categories').catch(() => ({ data: { data: [] } })),
        ]);
        setFeatured(Array.isArray(f?.data?.data) ? f.data.data : []);
        setLatest(Array.isArray(l?.data?.data) ? l.data.data : []);
        setTopSelling(Array.isArray(t?.data?.data) ? t.data.data : []);
        setBanners(Array.isArray(b?.data?.data) ? b.data.data : []);
        setCategories(Array.isArray(c?.data?.data) ? c.data.data : []);
      } catch {
        setFeatured([]);
        setLatest([]);
        setTopSelling([]);
        setBanners([]);
        setCategories([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section — premium dark background with gold accents */}
      <section className="relative overflow-hidden bg-[#111111] text-white border-b border-neutral-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D99000]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#D99000]/10 border border-[#D99000]/30 text-[#D99000] text-sm font-semibold mb-6">
                🎉 Grand Opening Sale — Up to 40% Off
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white font-sans">
                Your Trusted
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#D99000] to-amber-500 mt-2">
                  Raj Mobile & Electronics
                </span>
              </h1>
              <p className="mt-6 text-lg text-neutral-300 max-w-lg font-light leading-relaxed font-sans">
                Your Trusted Raj Mobile & Electronics Store. Explore top brands at the best prices with genuine warranty in Bhaktapur, Nepal.
              </p>
              <div className="flex flex-wrap gap-4 mt-10">
                <Link
                  to="/products"
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D99000] to-[#8B5E00] text-white font-semibold hover:opacity-95 transition-opacity shadow-lg shadow-amber-900/30"
                >
                  Shop Now
                </Link>
                <Link
                  to="/products?sort=popular"
                  className="px-8 py-3.5 rounded-xl bg-transparent border border-neutral-700 text-white font-semibold hover:bg-white/5 transition shadow-sm"
                >
                  🔥 Best Sellers
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:flex justify-center"
            >
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-[#D99000]/35 to-amber-500/10 blur-xl absolute" />
                <div className="relative animate-float flex items-center justify-center bg-[#1c1c1c] p-6 rounded-3xl border border-neutral-800 shadow-2xl shadow-black/80">
                  <img src="/logo.jpg" alt="Raj Mobile & Electrics Logo" className="w-64 h-64 rounded-2xl object-cover" style={{ filter: 'sepia(0.6) saturate(1.4) brightness(0.9)' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Trust Badges */}
      <section className="border-b border-surface-200/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiTruck, title: 'Free Delivery', desc: 'On orders above Rs. 5,000' },
              { icon: FiShield, title: 'Genuine Products', desc: '100% authentic guarantee' },
              { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
              { icon: FiHeadphones, title: '24/7 Support', desc: 'Help when you need it' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-surface-700/50">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      {(categories?.length ?? 0) > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <SectionHeader title="Shop by Category" subtitle="Browse our wide range of electronics" href="/products" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {categories.slice(0, 14).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-surface-200/60 hover:border-primary-300 hover:shadow-card-hover transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-surface-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {CATEGORY_ICONS[cat.slug] || '📦'}
                  </div>
                  <span className="text-xs font-medium text-surface-700 group-hover:text-primary-600 transition text-center leading-tight">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(featured?.length ?? 0) > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <SectionHeader title="Featured Products" subtitle="Hand-picked top electronics" href="/products?featured=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {featured.slice(0, 6).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <span className="text-4xl mb-2 block">📱</span>
            <h3 className="text-xl font-bold mt-2">Smartphones</h3>
            <p className="text-white/70 text-sm mt-1">Latest flagships from top brands</p>
            <Link to="/products?category=smartphones" className="inline-flex items-center gap-1 text-sm font-semibold mt-3 hover:gap-2 transition-all">
              Shop Now <FiChevronRight />
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-white relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <span className="text-4xl mb-2 block">🔌</span>
            <h3 className="text-xl font-bold mt-2">Electrical Items</h3>
            <p className="text-white/70 text-sm mt-1">Cables, chargers, switches, & essentials</p>
            <Link to="/products?category=electrical-items" className="inline-flex items-center gap-1 text-sm font-semibold mt-3 hover:gap-2 transition-all">
              Shop Now <FiChevronRight />
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl bg-gradient-to-r from-surface-800 to-surface-900 p-8 text-white relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <span className="text-4xl mb-2 block">⌚</span>
            <h3 className="text-xl font-bold mt-2">Wearables</h3>
            <p className="text-white/70 text-sm mt-1">Smartwatches & fitness trackers</p>
            <Link to="/products?category=smart-watches" className="inline-flex items-center gap-1 text-sm font-semibold mt-3 hover:gap-2 transition-all">
              Shop Now <FiChevronRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Latest Products */}
      {(latest?.length ?? 0) > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <SectionHeader title="New Arrivals" subtitle="Just landed in our store" href="/products?sort=newest" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {latest.slice(0, 6).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Top Selling */}
      {(topSelling?.length ?? 0) > 0 && (
        <section className="bg-surface-100/50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader title="🔥 Best Sellers" subtitle="Most popular products" href="/products?sort=popular" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topSelling.slice(0, 6).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when no products */}
      {!loading && (featured?.length ?? 0) === 0 && (latest?.length ?? 0) === 0 && (
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-7xl mb-4">🛍️</div>
          <h2 className="text-2xl font-bold mb-2">Welcome to {APP_NAME}!</h2>
          <p className="text-surface-700/60 max-w-md mx-auto">
            Products will appear here once the admin adds them. Start by setting up the database and adding your first product.
          </p>
        </section>
      )}
    </div>
  );
}
