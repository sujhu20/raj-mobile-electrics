import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiEye } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, CURRENCY, ORDER_STATUS_COLORS, ORDER_STATUSES } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { TableSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { Order, PaginationMeta } from '../../types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [_pagination, setPagination] = useState<PaginationMeta | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter) params.set('status', filter);
    if (search) params.set('search', search);
    try {
      const { data } = await api.get(`${ENDPOINTS.ORDERS.ADMIN_LIST}?${params}`);
      setOrders(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  }, [page, filter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { document.title = `Orders — ${APP_NAME} Admin`; }, []);

  const handleStatusUpdate = useCallback(async (orderId: string, status: string) => {
    try {
      await api.put(ENDPOINTS.ORDERS.ADMIN_STATUS(orderId), { status });
      toast.success(`Order updated to ${status}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: status as Order['status'] });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update'); }
  }, [fetchOrders, selectedOrder]);

  const statusFilters = ['', ...ORDER_STATUSES];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {statusFilters.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${filter === s ? 'gradient-primary text-white' : 'bg-white border border-surface-200 hover:bg-surface-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchOrders(); }} className="flex gap-2 ml-auto">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order # or email"
              className="h-9 pl-8 pr-3 rounded-lg border border-surface-200 text-xs outline-none focus:border-primary-400 w-48" />
          </div>
        </form>
      </div>

      {/* Table */}
      {loading ? <TableSkeleton rows={5} cols={7} /> : (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200/60 bg-surface-50">
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Order</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Customer</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Items</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Total</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Payment</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Status</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Date</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-surface-700/50">No orders found</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="border-b border-surface-100 hover:bg-surface-50/50 transition">
                    <td className="px-4 py-3 text-sm font-semibold">#{order.orderNumber}</td>
                    <td className="px-4 py-3"><p className="text-sm font-medium">{order.user?.firstName} {order.user?.lastName}</p><p className="text-xs text-surface-700/50">{order.user?.email}</p></td>
                    <td className="px-4 py-3 text-sm">{order.items?.length}</td>
                    <td className="px-4 py-3 text-sm font-bold">{CURRENCY} {Number(order.total).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${order.payment?.status === 'COMPLETED' ? 'text-success-600' : 'text-warning-600'}`}>{order.payment?.method}</span></td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        aria-label={`Status for order ${order.orderNumber}`}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-700/50">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-700/60 transition" aria-label={`View order ${order.orderNumber}`}><FiEye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)} role="dialog" aria-modal="true" aria-label="Order details">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Order #{selectedOrder.orderNumber}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-surface-700/60">Customer</span><span className="font-medium">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Email</span><span>{selectedOrder.user?.email}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Total</span><span className="font-bold">{CURRENCY} {Number(selectedOrder.total).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ORDER_STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
              <hr className="border-surface-200" />
              <p className="font-semibold">Items:</p>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-1"><span>{item.product?.name || 'Product'} × {item.quantity}</span><span className="font-medium">{CURRENCY} {Number(item.total).toLocaleString()}</span></div>
              ))}
            </div>
            <button onClick={() => setSelectedOrder(null)} className="w-full h-10 mt-6 rounded-xl bg-surface-100 font-medium text-sm">Close</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
