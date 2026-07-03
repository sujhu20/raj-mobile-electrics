import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiStar, FiShoppingCart } from 'react-icons/fi';
import api from '../../config/api';
import { CURRENCY } from '../../config/constants';
import { useAppDispatch } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query) {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(query)}`)
        .then(r => setResults(r.data?.data || { products: [], categories: [] }))
        .catch(() => setResults({ products: [], categories: [] }))
        .finally(() => setLoading(false));
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) setSearchParams({ q: searchInput.trim() });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-700/40" size={20} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search phones, brands, accessories..."
            className="w-full h-14 pl-12 pr-24 rounded-2xl border-2 border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-base"
            autoFocus />
          <button type="submit" className="absolute right-2 top-2 h-10 px-6 rounded-xl gradient-primary text-white font-semibold text-sm">Search</button>
        </div>
      </form>

      {query && <h2 className="text-lg font-bold mb-6">Results for "<span className="text-primary-600">{query}</span>"</h2>}

      {/* Category matches */}
      {(results?.categories?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-sm text-surface-700/60 mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {results.categories.map((cat: any) => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} className="px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition">{cat.name}</Link>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-shimmer rounded-2xl" />)}
        </div>
      ) : (results?.products?.length ?? 0) > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.products.map((product: any, i: number) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden hover:shadow-card-hover transition-all group">
              <Link to={`/products/${product.slug}`} className="block aspect-square bg-surface-50 p-3">
                <img src={product.images?.[0]?.url || 'https://via.placeholder.com/200'} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              </Link>
              <div className="p-3">
                <p className="text-xs text-primary-600 font-medium">{product.brand}</p>
                <Link to={`/products/${product.slug}`}><h3 className="font-semibold text-sm line-clamp-2 hover:text-primary-600">{product.name}</h3></Link>
                <div className="flex items-center gap-1 mt-1">{[...Array(5)].map((_, i) => <FiStar key={i} size={11} className={i < Math.floor(product.avgRating) ? 'text-warning-500 fill-warning-500' : 'text-surface-200'} />)}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold">{CURRENCY} {Number(product.price).toLocaleString()}</span>
                  <button onClick={() => dispatch(addToCart({ productId: product.id }))} disabled={product.stock === 0}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${product.stock === 0 ? 'bg-surface-100 text-surface-700/30 cursor-not-allowed' : 'gradient-primary text-white hover:opacity-90'}`}>
                    <FiShoppingCart size={14} />
                  </button>
                </div>
                {product.stock === 0 && <p className="text-[10px] text-danger-500 font-medium mt-1">Out of Stock</p>}
                {product.stock > 0 && product.stock <= 5 && <p className="text-[10px] text-warning-600 font-medium mt-1">Only {product.stock} left!</p>}
              </div>
            </motion.div>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">No results found</h3>
          <p className="text-surface-700/60 text-sm">Try different keywords or browse our categories</p>
        </div>
      ) : null}
    </div>
  );
}
