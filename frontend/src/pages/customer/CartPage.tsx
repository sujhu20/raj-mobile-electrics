import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon } from '../../store/slices/cartSlice';
import { CURRENCY } from '../../config/constants';
import { useState } from 'react';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, summary, coupon, isLoading } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => { if (isAuthenticated) dispatch(fetchCart()); }, [isAuthenticated, dispatch]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    const result = await dispatch(applyCoupon(couponCode));
    if (applyCoupon.rejected.match(result)) setCouponError(result.payload as string);
    else setCouponCode('');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Please login to view your cart</h2>
        <Link to="/login" className="inline-flex items-center px-6 py-3 mt-4 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition">Login</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-surface-700/60 mb-6">Looks like you haven't added anything yet</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition">
          <FiShoppingBag size={18} /> Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart <span className="text-surface-700/50 font-normal text-lg">({summary.itemCount} items)</span></h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex gap-4 p-4 bg-white rounded-2xl border border-surface-200/60">
              <Link to={`/products/${item.product.slug}`} className="w-24 h-24 rounded-xl bg-surface-50 overflow-hidden shrink-0">
                <img src={item.product.images?.[0]?.url || 'https://via.placeholder.com/100'} alt={item.product.name} className="w-full h-full object-contain p-2" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.slug}`}>
                  <p className="text-xs text-primary-600 font-medium">{item.product.brand}</p>
                  <h3 className="font-semibold text-sm line-clamp-2">{item.product.name}</h3>
                </Link>
                <p className="text-lg font-bold mt-1">{CURRENCY} {Number(item.product.price).toLocaleString()}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center bg-surface-100 rounded-lg">
                    <button onClick={() => dispatch(updateCartItem({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) }))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface-200 rounded-l-lg transition"><FiMinus size={14} /></button>
                    <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => dispatch(updateCartItem({ itemId: item.id, quantity: Math.min(item.product.stock, item.quantity + 1) }))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface-200 rounded-r-lg transition"><FiPlus size={14} /></button>
                  </div>
                  <button onClick={() => dispatch(removeFromCart(item.id))} className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition"><FiTrash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-surface-200/60 p-6 sticky top-36">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400 uppercase" />
                </div>
                <button onClick={handleApplyCoupon} disabled={!couponCode}
                  className="px-4 h-10 rounded-lg bg-surface-900 text-white text-sm font-medium hover:bg-surface-800 transition disabled:opacity-40">
                  Apply
                </button>
              </div>
              {couponError && <p className="text-danger-500 text-xs mt-1">{couponError}</p>}
              {coupon && <p className="text-success-600 text-xs mt-1 font-medium">Coupon "{coupon.code}" applied!</p>}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-surface-700/60">Subtotal</span><span className="font-medium">{CURRENCY} {summary.subtotal.toLocaleString()}</span></div>
              {summary.discount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{CURRENCY} {summary.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span className="text-surface-700/60">Tax (13%)</span><span className="font-medium">{CURRENCY} {Math.round(summary.tax).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Delivery</span><span className="font-medium">{summary.deliveryFee === 0 ? <span className="text-success-600">FREE</span> : `${CURRENCY} ${summary.deliveryFee}`}</span></div>
              <hr className="border-surface-200" />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{CURRENCY} {Math.round(summary.total).toLocaleString()}</span></div>
            </div>

            <Link to="/checkout" className="flex items-center justify-center gap-2 w-full h-12 mt-6 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition shadow-lg">
              Proceed to Checkout <FiArrowRight size={18} />
            </Link>

            <Link to="/products" className="block text-center text-sm text-primary-600 font-medium mt-3 hover:text-primary-700 transition">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
