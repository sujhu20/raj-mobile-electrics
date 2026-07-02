import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiShoppingCart, FiHeart, FiMinus, FiPlus, FiCheck, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import api from '../../config/api';
import { CURRENCY } from '../../config/constants';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((s) => s.wishlist.items);
  const [product, setProduct] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [loading, setLoading] = useState(true);

  const isWishlisted = product && (wishlistItems || []).some((i) => i.productId === product.id);
  const discount = product?.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`).then(r => {
      setProduct(r.data?.data || null);
      if (r.data?.data?.id) {
        api.get(`/products/${r.data.data.id}/similar`)
          .then(s => setSimilar(Array.isArray(s.data?.data) ? s.data.data : []))
          .catch(() => setSimilar([]));
      }
    }).catch(() => {
      setProduct(null);
      setSimilar([]);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square animate-shimmer rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 w-20 animate-shimmer rounded" />
            <div className="h-8 w-3/4 animate-shimmer rounded" />
            <div className="h-6 w-40 animate-shimmer rounded" />
            <div className="h-10 w-48 animate-shimmer rounded mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <Link to="/products" className="text-primary-600 font-medium">Browse All Products</Link>
      </div>
    );
  }

  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [{ url: 'https://via.placeholder.com/600x600?text=Phone' }];
  const specs = product?.specifications || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-700/60 mb-6">
        <Link to="/" className="hover:text-primary-600 transition">Home</Link><span>/</span>
        <Link to="/products" className="hover:text-primary-600 transition">Products</Link><span>/</span>
        <span className="text-surface-900 font-medium line-clamp-1">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="aspect-square bg-white rounded-2xl border border-surface-200/60 p-6 mb-3 overflow-hidden">
            <img src={images[selectedImage]?.url} alt={product.name} className="w-full h-full object-contain" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl border-2 overflow-hidden shrink-0 transition ${selectedImage === i ? 'border-primary-500' : 'border-surface-200 hover:border-surface-700/30'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <p className="text-sm text-primary-600 font-medium">{product.brand}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 mt-1">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <FiStar key={i} size={18} className={i < Math.floor(product.avgRating) ? 'text-warning-500 fill-warning-500' : 'text-surface-200'} />)}
            </div>
            <span className="text-sm text-surface-700/60">{Number(product.avgRating).toFixed(1)} ({product.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-surface-900">{CURRENCY} {Number(product.price).toLocaleString()}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-surface-700/40 line-through">{CURRENCY} {Number(product.compareAtPrice).toLocaleString()}</span>
                <span className="px-2.5 py-1 bg-danger-500 text-white text-xs font-bold rounded-lg">-{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <span className="flex items-center gap-1 text-success-600 text-sm font-medium"><FiCheck size={16} /> In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-danger-500 text-sm font-medium">Out of Stock</span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center bg-surface-100 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-surface-200 rounded-l-xl transition"><FiMinus size={16} /></button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-surface-200 rounded-r-xl transition"><FiPlus size={16} /></button>
              </div>
              <button onClick={() => dispatch(addToCart({ productId: product.id, quantity }))}
                className="flex-1 h-12 rounded-xl gradient-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg">
                <FiShoppingCart size={18} /> Add to Cart
              </button>
              <button onClick={() => dispatch(toggleWishlist(product.id))}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition ${isWishlisted ? 'border-danger-500 bg-danger-50 text-danger-500' : 'border-surface-200 hover:border-danger-500 hover:text-danger-500'}`}>
                <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}

          {/* Buy Now */}
          {product.stock > 0 && (
            <Link to="/checkout" className="block w-full h-12 rounded-xl bg-surface-900 text-white font-semibold text-center leading-[3rem] hover:bg-surface-800 transition">
              Buy Now
            </Link>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-surface-200/60">
            {[
              { icon: FiTruck, label: 'Free Delivery', sub: 'Above Rs. 5,000' },
              { icon: FiShield, label: 'Warranty', sub: '1 Year' },
              { icon: FiRefreshCw, label: 'Easy Return', sub: '7 Days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center p-3 bg-surface-50 rounded-xl">
                <Icon size={18} className="text-primary-600 mb-1" />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[10px] text-surface-700/50">{sub}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-1 border-b border-surface-200">
          {(['description', 'specs', 'reviews'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition capitalize ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-700/60 hover:text-surface-900'}`}>
              {tab === 'specs' ? 'Specifications' : tab}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-surface-700/80 leading-relaxed">{product.description}</div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              {Object.entries(specs).length > 0 ? Object.entries(specs).map(([key, value]) => (
                <div key={key} className="flex py-3 border-b border-surface-100 last:border-0">
                  <span className="w-40 text-sm font-medium text-surface-700/60 capitalize shrink-0">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm text-surface-900">{String(value)}</span>
                </div>
              )) : <p className="text-surface-700/60 text-sm">No specifications available</p>}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {(product?.reviews?.length ?? 0) > 0 ? product.reviews.map((review: any) => (
                <div key={review.id} className="py-4 border-b border-surface-100 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">{review.user.firstName[0]}</div>
                    <div>
                      <p className="font-semibold text-sm">{review.user.firstName} {review.user.lastName}</p>
                      <div className="flex items-center gap-1">{[...Array(5)].map((_, i) => <FiStar key={i} size={12} className={i < review.rating ? 'text-warning-500 fill-warning-500' : 'text-surface-200'} />)}</div>
                    </div>
                    {review.isVerified && <span className="px-2 py-0.5 bg-success-500/10 text-success-600 text-[10px] font-semibold rounded-full">✓ Verified</span>}
                  </div>
                  {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                  <p className="text-sm text-surface-700/70">{review.comment}</p>
                </div>
              )) : <p className="text-surface-700/60 text-sm py-4">No reviews yet. Be the first to review!</p>}
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {(similar?.length ?? 0) > 0 && (
        <section className="mt-12 pt-8 border-t border-surface-200/60">
          <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {similar.slice(0, 6).map((p, _i) => (
              <Link key={p.id} to={`/products/${p.slug}`} className="group bg-white rounded-2xl border border-surface-200/60 overflow-hidden hover:shadow-card-hover transition-all p-3">
                <div className="aspect-square bg-surface-50 rounded-xl overflow-hidden mb-2">
                  <img src={p.images?.[0]?.url || 'https://via.placeholder.com/200'} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-xs text-primary-600 font-medium">{p.brand}</p>
                <p className="text-sm font-semibold line-clamp-2">{p.name}</p>
                <p className="text-sm font-bold mt-1">{CURRENCY} {Number(p.price).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
