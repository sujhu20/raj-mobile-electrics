import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiTrash2, FiStar } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWishlist, toggleWishlist, moveToCart } from '../../store/slices/wishlistSlice';
import { CURRENCY } from '../../config/constants';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((s) => s.wishlist);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  const handleMoveToCart = async (productId: string) => {
    await dispatch(moveToCart(productId));
    toast.success('Moved to cart');
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
        <p className="text-surface-700/60 mb-6">Save items you love and come back to them later</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Wishlist <span className="text-surface-700/50 font-normal text-lg">({items.length} items)</span></h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item, i) => {
          const product = item.product;
          const image = product.images?.[0]?.url || 'https://via.placeholder.com/200';
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden group hover:shadow-card-hover transition-all">
              <div className="relative aspect-square bg-surface-50 p-4">
                <button onClick={() => dispatch(toggleWishlist(product.id))}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-danger-500 text-white flex items-center justify-center hover:bg-danger-600 transition z-10">
                  <FiTrash2 size={14} />
                </button>
                <Link to={`/products/${product.slug}`}>
                  <img src={image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                </Link>
              </div>
              <div className="p-4">
                <Link to={`/products/${product.slug}`}>
                  <p className="text-xs text-primary-600 font-medium">{product.brand}</p>
                  <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary-600 transition">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => <FiStar key={i} size={11} className={i < Math.floor(product.avgRating) ? 'text-warning-500 fill-warning-500' : 'text-surface-200'} />)}
                </div>
                <p className="text-lg font-bold mt-2">{CURRENCY} {Number(product.price).toLocaleString()}</p>
                <button onClick={() => handleMoveToCart(product.id)} disabled={product.stock === 0}
                  className={`w-full h-10 mt-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition ${
                    product.stock === 0 ? 'bg-surface-100 text-surface-700/40 cursor-not-allowed' : 'gradient-primary text-white hover:opacity-90'}`}>
                  <FiShoppingCart size={16} /> {product.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
