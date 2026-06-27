import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiPackage, FiTruck, FiMapPin } from 'react-icons/fi';
import api from '../../config/api';
import { CURRENCY, ORDER_STATUS_COLORS } from '../../config/constants';
import toast from 'react-hot-toast';

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    try {
      await api.post(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      setOrder({ ...order, status: 'CANCELLED' });
      toast.success('Order cancelled');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 animate-shimmer rounded-2xl" /></div>;
  if (!order) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><h2 className="text-2xl font-bold">Order not found</h2></div>;

  const currentStep = ORDER_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/orders" className="text-sm text-primary-600 font-medium mb-1 block">← Back to Orders</Link>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-surface-700/50">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>{order.status}</span>
      </div>

      {/* Order Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-surface-200/60 p-6 mb-6">
          <h2 className="font-bold mb-6">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-surface-200">
              <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${Math.max(0, currentStep) / (ORDER_STEPS.length - 1) * 100}%` }} />
            </div>
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition ${i <= currentStep ? 'gradient-primary text-white' : 'bg-white border-2 border-surface-200 text-surface-700/40'}`}>
                  {i < currentStep ? <FiCheck size={18} /> : i + 1}
                </div>
                <span className={`text-xs mt-2 font-medium ${i <= currentStep ? 'text-primary-600' : 'text-surface-700/40'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-danger-500/10 rounded-2xl p-6 mb-6 flex items-center gap-3">
          <FiX className="text-danger-500 shrink-0" size={24} />
          <div>
            <p className="font-bold text-danger-500">Order Cancelled</p>
            {order.cancelReason && <p className="text-sm text-surface-700/70">Reason: {order.cancelReason}</p>}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-surface-200/60 p-6">
            <h2 className="font-bold mb-4">Items ({order.items?.length})</h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/80'} alt="" className="w-20 h-20 rounded-xl object-contain bg-surface-50 p-1" />
                  <div className="flex-1">
                    <Link to={`/products/${item.product?.slug}`} className="font-semibold text-sm hover:text-primary-600 transition">{item.product?.name}</Link>
                    <p className="text-xs text-surface-700/50">Qty: {item.quantity}</p>
                    <p className="font-bold text-sm mt-1">{CURRENCY} {Number(item.total).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Address */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-surface-200/60 p-5">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><FiMapPin size={16} /> Shipping Address</h3>
              <p className="text-sm font-medium">{order.address.fullName}</p>
              <p className="text-sm text-surface-700/60">{order.address.street}, {order.address.city}</p>
              <p className="text-sm text-surface-700/60">{order.address.state}</p>
              <p className="text-sm text-surface-700/50">{order.address.phone}</p>
            </div>
          )}

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-surface-200/60 p-5">
            <h3 className="font-bold text-sm mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-surface-700/60">Method</span><span className="font-medium">{order.payment?.method || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Status</span><span className={`font-medium ${order.payment?.status === 'COMPLETED' ? 'text-success-600' : 'text-warning-600'}`}>{order.payment?.status || 'N/A'}</span></div>
              <hr className="border-surface-100" />
              <div className="flex justify-between"><span className="text-surface-700/60">Subtotal</span><span>{CURRENCY} {Number(order.subtotal).toLocaleString()}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{CURRENCY} {Number(order.discount).toLocaleString()}</span></div>}
              <div className="flex justify-between"><span className="text-surface-700/60">Tax</span><span>{CURRENCY} {Math.round(Number(order.tax)).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Delivery</span><span>{Number(order.deliveryFee) === 0 ? 'FREE' : `${CURRENCY} ${Number(order.deliveryFee)}`}</span></div>
              <hr className="border-surface-100" />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{CURRENCY} {Number(order.total).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Cancel */}
          {['PENDING', 'CONFIRMED'].includes(order.status) && (
            <button onClick={() => setShowCancelConfirm(true)} className="w-full h-10 rounded-xl border-2 border-danger-500 text-danger-500 text-sm font-semibold hover:bg-danger-50 transition">
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-surface-900">Cancel Order</h3>
            <p className="text-sm text-surface-700/60">Are you sure you want to cancel this order? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 rounded-xl bg-surface-100 text-sm font-medium text-surface-700 hover:bg-surface-200 transition">Cancel</button>
              <button type="button" onClick={async () => {
                setShowCancelConfirm(false);
                await handleCancel();
              }} className="px-4 py-2 rounded-xl bg-danger-500 text-white text-sm font-medium hover:bg-danger-600 transition">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
