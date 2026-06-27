import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp, FiPackage, FiUsers, FiAlertCircle } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, CURRENCY } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { CardSkeleton, ListSkeleton } from '../../components/ui/Skeletons';
import type { DashboardStats, MonthlyRevenue, TopProduct } from '../../types';

export default function AdminAnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get(ENDPOINTS.ANALYTICS.DASHBOARD).catch(() => ({ data: { data: null } })),
      api.get(ENDPOINTS.ANALYTICS.REVENUE).catch(() => ({ data: { data: [] } })),
      api.get(ENDPOINTS.ANALYTICS.TOP_PRODUCTS).catch(() => ({ data: { data: [] } })),
    ]).then(([d, r, t]) => {
      if (cancelled) return;
      setDashboard(d.data.data);
      setRevenue(r.data.data);
      setTopProducts(t.data.data);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { document.title = `Analytics — ${APP_NAME} Admin`; }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CardSkeleton count={4} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ListSkeleton count={6} /></div>
        <ListSkeleton count={5} />
      </div>
    </div>
  );

  const stats = dashboard ? [
    { label: 'Total Revenue', value: `${CURRENCY} ${dashboard.revenue.total.toLocaleString()}`, change: `${dashboard.revenue.growth > 0 ? '+' : ''}${dashboard.revenue.growth}%`, icon: FiDollarSign, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
    { label: 'Monthly Revenue', value: `${CURRENCY} ${dashboard.revenue.monthly.toLocaleString()}`, change: 'This month', icon: FiTrendingUp, iconBg: 'bg-blue-100', iconColor: 'text-blue-700' },
    { label: 'Total Orders', value: dashboard.orders.total.toLocaleString(), change: `${dashboard.orders.pending} pending`, icon: FiPackage, iconBg: 'bg-violet-100', iconColor: 'text-violet-700' },
    { label: 'Customers', value: dashboard.users.total.toLocaleString(), change: '', icon: FiUsers, iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics</h1>

      {/* KPI Cards — white bg, dark text, colored icon box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon size={20} className={stat.iconColor} />
              </div>
              {stat.change && (
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Monthly Revenue</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span>Month</span>
              <span className="w-12 text-right">Orders</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {revenue.map((m, i) => {
              const maxRevenue = Math.max(...revenue.map(r => r.revenue), 1);
              const pct = (m.revenue / maxRevenue) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-8">{m.month}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="h-full bg-blue-600 rounded-lg flex items-center justify-end px-2 min-w-[2px]"
                    >
                      {pct > 20 && (
                        <span className="text-[10px] text-white font-semibold">{CURRENCY} {m.revenue.toLocaleString()}</span>
                      )}
                    </motion.div>
                  </div>
                  {pct <= 20 && m.revenue > 0 && (
                    <span className="text-[10px] text-slate-600 font-medium hidden sm:block">{CURRENCY} {m.revenue.toLocaleString()}</span>
                  )}
                  <span className="text-xs font-semibold text-slate-700 w-12 text-right tabular-nums">{m.orders}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Top Selling</h3>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>{i + 1}</span>
                  <img src={p.images?.[0]?.url || 'https://via.placeholder.com/32'} alt="" className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.totalSold} sold</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{CURRENCY} {Number(p.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {dashboard?.products.lowStock != null && dashboard.products.lowStock > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3" role="alert">
          <FiAlertCircle className="text-amber-700 shrink-0" size={20} />
          <p className="text-sm text-amber-800 font-medium">{dashboard.products.lowStock} products have low stock (5 or fewer units)</p>
        </div>
      )}
    </div>
  );
}
