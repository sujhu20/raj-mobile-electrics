import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import api from '../../config/api';
import { CURRENCY, ORDER_STATUS_COLORS } from '../../config/constants';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    api.get(`/orders${params}`).then(r => setOrders(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  const statuses = ['', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === s ? 'gradient-primary text-white' : 'bg-white border border-surface-200 hover:bg-surface-50'}`}>
            {s || 'All Orders'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-shimmer rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold mb-2">No orders yet</h3>
          <p className="text-surface-700/60 text-sm mb-4">Start shopping to see your orders here</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/orders/${order.id}`} className="block bg-white rounded-2xl border border-surface-200/60 p-5 hover:shadow-card-hover transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600"><FiPackage size={20} /></div>
                    <div>
                      <p className="font-semibold text-sm">#{order.orderNumber}</p>
                      <p className="text-xs text-surface-700/50">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] || ''}`}>{order.status}</span>
                    <FiChevronRight className="text-surface-700/30 group-hover:text-primary-500 transition" />
                  </div>
                </div>
                <div className="flex items-center gap-3 overflow-hidden">
                  {order.items?.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="w-14 h-14 rounded-lg bg-surface-50 overflow-hidden shrink-0">
                      <img src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/56'} alt="" className="w-full h-full object-contain p-1" />
                    </div>
                  ))}
                  {order.items?.length > 4 && <span className="text-xs text-surface-700/50">+{order.items.length - 4} more</span>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
                  <span className="text-sm text-surface-700/60">{order.items?.length} item(s)</span>
                  <span className="text-lg font-bold">{CURRENCY} {Number(order.total).toLocaleString()}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
