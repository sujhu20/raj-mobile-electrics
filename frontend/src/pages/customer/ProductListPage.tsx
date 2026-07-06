import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiStar, FiShoppingCart, FiHeart } from 'react-icons/fi';
import api from '../../config/api';
import { CURRENCY, BRANDS } from '../../config/constants';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';

function ProductCard({ product, index }: { product: any; index: number }) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((s) => s.wishlist.items);
  const isWishlisted = wishlistItems.some((i) => i.productId === product.id);
  const image = product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product';
  const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.03 }}
      className="group bg-white rounded-2xl border border-surface-200/60 overflow-hidden hover:shadow-card-hover transition-all duration-500 ease-out hover:-translate-y-2 hover:border-primary-300">
      <div className="relative aspect-square bg-surface-50 p-4 overflow-hidden">
        {discount > 0 && <span className="absolute top-3 left-3 px-2.5 py-1 bg-danger-500 text-white text-xs font-bold rounded-lg z-10">-{discount}%</span>}
        <button onClick={() => dispatch(toggleWishlist(product.id))}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition z-10 ${isWishlisted ? 'bg-danger-500 text-white' : 'bg-white/80 text-surface-700 hover:bg-danger-500 hover:text-white'} shadow-sm`}>
          <FiHeart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/products/${product.slug}`}>
          <img src={image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </Link>
      </div>
      <div className="p-4">
        <Link to={`/products/${product.slug}`}>
          <p className="text-xs text-primary-600 font-medium mb-1">{product.brand}</p>
          <h3 className="font-semibold text-sm text-surface-900 line-clamp-2 hover:text-primary-600 transition leading-snug">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => <FiStar key={i} size={12} className={i < Math.floor(product.avgRating) ? 'text-warning-500 fill-warning-500' : 'text-surface-200'} />)}
          </div>
          <span className="text-xs text-surface-700/50">({product.reviewCount})</span>
        </div>
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-surface-900">{CURRENCY} {Number(product.price).toLocaleString()}</span>
            {product.compareAtPrice && <span className="text-xs text-surface-700/40 line-through ml-1.5">{CURRENCY} {Number(product.compareAtPrice).toLocaleString()}</span>}
          </div>
          <button onClick={() => dispatch(addToCart({ productId: product.id }))} disabled={product.stock === 0}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${product.stock === 0 ? 'bg-surface-100 text-surface-700/30 cursor-not-allowed' : 'gradient-primary text-white hover:opacity-90 shadow-sm'}`}>
            <FiShoppingCart size={15} />
          </button>
        </div>
        {product.stock === 0 && <p className="text-xs text-danger-500 font-medium mt-1">Out of Stock</p>}
      </div>
    </motion.div>
  );
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    api.get('/categories')
      .then(r => setCategories(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentBrand) params.set('brand', currentBrand);
    if (currentSort) params.set('sort', currentSort);
    if (currentMinPrice) params.set('minPrice', currentMinPrice);
    if (currentMaxPrice) params.set('maxPrice', currentMaxPrice);
    if (currentSearch) params.set('search', currentSearch);
    params.set('page', String(currentPage));
    params.set('limit', '12');

    api.get(`/products?${params.toString()}`).then(r => {
      setProducts(Array.isArray(r.data?.data) ? r.data.data : []);
      setPagination(r.data?.pagination || null);
    }).catch(() => {
      setProducts([]);
      setPagination(null);
    }).finally(() => setLoading(false));
  }, [currentCategory, currentBrand, currentSort, currentMinPrice, currentMaxPrice, currentPage, currentSearch]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  const brands = BRANDS;
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const hasActiveFilters = currentCategory || currentBrand || currentMinPrice || currentMaxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-700/60 mb-6">
        <Link to="/" className="hover:text-primary-600 transition">Home</Link>
        <span>/</span>
        <span className="text-surface-900 font-medium">
          {currentSearch ? `Search results for "${currentSearch}"` : (currentBrand || currentCategory || 'All Products')}
        </span>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters — Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-36 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Filters</h2>
              {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-danger-500 font-medium">Clear All</button>}
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl border border-surface-200/60 p-4">
              <h3 className="font-semibold text-sm mb-3">Category</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <button onClick={() => updateFilter('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!currentCategory ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                  All Categories
                </button>
                {categories.map((cat: any) => (
                  <button key={cat.id} onClick={() => updateFilter('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${currentCategory === cat.slug ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="bg-white rounded-xl border border-surface-200/60 p-4">
              <h3 className="font-semibold text-sm mb-3">Brand</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <button onClick={() => updateFilter('brand', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!currentBrand ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                  All Brands
                </button>
                {brands.map(brand => (
                  <button key={brand} onClick={() => updateFilter('brand', brand)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${currentBrand === brand ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-xl border border-surface-200/60 p-4">
              <h3 className="font-semibold text-sm mb-3">Price Range</h3>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={currentMinPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                <input type="number" placeholder="Max" value={currentMaxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[{ label: 'Under 20K', min: '', max: '20000' }, { label: '20K-50K', min: '20000', max: '50000' }, { label: '50K-100K', min: '50000', max: '100000' }, { label: '100K+', min: '100000', max: '' }].map(r => (
                  <button key={r.label} onClick={() => { updateFilter('minPrice', r.min); updateFilter('maxPrice', r.max); }}
                    className="px-3 py-1.5 rounded-lg bg-surface-50 text-xs font-medium hover:bg-primary-50 hover:text-primary-700 transition">
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {currentSearch && (
            <div className="mb-4 bg-white rounded-xl border border-surface-200/60 p-4 shadow-sm">
              <h2 className="text-base font-bold text-surface-900">
                Search Results for: <span className="text-primary-600">"{currentSearch}"</span>
              </h2>
            </div>
          )}
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-surface-200/60 p-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 text-sm font-medium">
                <FiFilter size={16} /> Filters
              </button>
              <p className="text-sm text-surface-700/60">
                {pagination ? `${pagination.total} products found` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select value={currentSort} onChange={(e) => updateFilter('sort', e.target.value)}
                className="h-10 px-3 pr-8 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400 bg-white appearance-none cursor-pointer">
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {currentCategory && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  {currentCategory} <button onClick={() => updateFilter('category', '')}><FiX size={14} /></button>
                </span>
              )}
              {currentBrand && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  {currentBrand} <button onClick={() => updateFilter('brand', '')}><FiX size={14} /></button>
                </span>
              )}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                  {currentMinPrice || '0'} - {currentMaxPrice || '∞'} <button onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}><FiX size={14} /></button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
                  <div className="aspect-square animate-shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 animate-shimmer rounded" />
                    <div className="h-4 w-full animate-shimmer rounded" />
                    <div className="h-4 w-3/4 animate-shimmer rounded" />
                    <div className="h-6 w-24 animate-shimmer rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (products?.length ?? 0) === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-surface-700/60 text-sm mb-4">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="px-6 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm hover:opacity-90 transition">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={!pagination.hasPrev}
                onClick={() => updateFilter('page', String(currentPage - 1))}
                className="px-4 py-2 rounded-lg border border-surface-200 text-sm font-medium disabled:opacity-40 hover:bg-surface-50 transition">
                Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button key={page} onClick={() => updateFilter('page', String(page))}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition ${currentPage === page ? 'gradient-primary text-white' : 'border border-surface-200 hover:bg-surface-50'}`}>
                    {page}
                  </button>
                );
              })}
              <button disabled={!pagination.hasNext}
                onClick={() => updateFilter('page', String(currentPage + 1))}
                className="px-4 py-2 rounded-lg border border-surface-200 text-sm font-medium disabled:opacity-40 hover:bg-surface-50 transition">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-white z-50 p-6 overflow-y-auto lg:hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-700">
                  <FiX size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                {/* Categories */}
                <div className="bg-white rounded-xl border border-surface-200/60 p-4">
                  <h3 className="font-semibold text-sm mb-3">Category</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    <button onClick={() => { updateFilter('category', ''); setShowFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!currentCategory ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                      All Categories
                    </button>
                    {categories.map((cat: any) => (
                      <button key={cat.id} onClick={() => { updateFilter('category', cat.slug); setShowFilters(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${currentCategory === cat.slug ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="bg-white rounded-xl border border-surface-200/60 p-4">
                  <h3 className="font-semibold text-sm mb-3">Brand</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    <button onClick={() => { updateFilter('brand', ''); setShowFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!currentBrand ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                      All Brands
                    </button>
                    {brands.map(brand => (
                      <button key={brand} onClick={() => { updateFilter('brand', brand); setShowFilters(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${currentBrand === brand ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-surface-50'}`}>
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-white rounded-xl border border-surface-200/60 p-4">
                  <h3 className="font-semibold text-sm mb-3">Price Range</h3>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={currentMinPrice}
                      onChange={(e) => updateFilter('minPrice', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                    <input type="number" placeholder="Max" value={currentMaxPrice}
                      onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {[{ label: 'Under 20K', min: '', max: '20000' }, { label: '20K-50K', min: '20000', max: '50000' }, { label: '50K-100K', min: '50000', max: '100000' }, { label: '100K+', min: '100000', max: '' }].map(r => (
                      <button key={r.label} onClick={() => { updateFilter('minPrice', r.min); updateFilter('maxPrice', r.max); setShowFilters(false); }}
                        className="px-3 py-1.5 rounded-lg bg-surface-50 text-xs font-medium hover:bg-primary-50 hover:text-primary-700 transition">
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-100 flex gap-3">
                {hasActiveFilters && (
                  <button onClick={() => { clearFilters(); setShowFilters(false); }} className="flex-1 py-2.5 rounded-xl border border-danger-200 text-danger-500 font-semibold text-sm hover:bg-danger-50 transition">
                    Clear All
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition">
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
