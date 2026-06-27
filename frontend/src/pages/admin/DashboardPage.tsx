import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiPackage, FiUsers, FiDollarSign, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, CURRENCY, ROUTES } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { CardSkeleton, ListSkeleton } from '../../components/ui/Skeletons';
import type { DashboardStats } from '../../types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const { data } = await api.get(ENDPOINTS.ANALYTICS.DASHBOARD);
        if (!cancelled) setStats(data.data);
      } catch {
        // Analytics API may be unavailable — show empty state
      }
      if (!cancelled) setLoading(false);
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  const statCards = useMemo(() => [
    {
      label: 'Total Revenue',
      value: `${CURRENCY} ${(stats?.revenue?.total ?? 0).toLocaleString()}`,
      icon: FiDollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      change: stats?.revenue?.growth ? `${stats.revenue.growth > 0 ? '+' : ''}${stats.revenue.growth}%` : '',
      trend: (stats?.revenue?.growth ?? 0) >= 0 ? 'up' as const : 'down' as const,
    },
    {
      label: 'Total Orders',
      value: (stats?.orders?.total ?? 0).toLocaleString(),
      icon: FiPackage,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      change: stats?.orders?.pending ? `${stats.orders.pending} pending` : '',
      trend: 'up' as const,
    },
    {
      label: 'Total Products',
      value: (stats?.products?.total ?? 0).toLocaleString(),
      icon: FiShoppingBag,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-700',
      change: stats?.products?.lowStock ? `${stats.products.lowStock} low stock` : '',
      trend: (stats?.products?.lowStock ?? 0) > 0 ? 'down' as const : 'up' as const,
    },
    {
      label: 'Customers',
      value: (stats?.users?.total ?? 0).toLocaleString(),
      icon: FiUsers,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      change: '',
      trend: 'up' as const,
    },
  ], [stats]);

  const quickActions = useMemo(() => [
    { to: ROUTES.ADMIN_PRODUCT_NEW, label: 'Add Product', icon: '📦', bg: 'bg-blue-50 hover:bg-blue-100 border border-blue-200', text: 'text-blue-800' },
    { to: ROUTES.ADMIN_ORDERS, label: 'View Orders', icon: '📋', bg: 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200', text: 'text-emerald-800' },
    { to: ROUTES.ADMIN_CATEGORIES, label: 'Manage Categories', icon: '📂', bg: 'bg-amber-50 hover:bg-amber-100 border border-amber-200', text: 'text-amber-800' },
    { to: ROUTES.ADMIN_ANALYTICS, label: 'View Analytics', icon: '📊', bg: 'bg-violet-50 hover:bg-violet-100 border border-violet-200', text: 'text-violet-800' },
  ], []);

  useEffect(() => { document.title = `Dashboard — ${APP_NAME} Admin`; }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Welcome back! Here's what's happening with your {APP_NAME} store.
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="mb-8"><CardSkeleton count={4} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                {/* Icon with colored background */}
                <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon size={20} className={stat.iconColor} />
                </div>
                {/* Trend badge */}
                {stat.change && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    stat.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {stat.trend === 'up' ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                    {stat.change}
                  </span>
                )}
              </div>
              {/* Value */}
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
              {/* Label */}
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom grid: Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ to, label, icon, bg, text }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 p-4 rounded-xl ${bg} transition-colors font-semibold text-sm ${text}`}
              >
                <span className="text-xl">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Recent Activity</h3>
          {loading ? (
            <ListSkeleton count={3} />
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-sm text-slate-500">Activity feed will populate as orders come in.</p>
              <Link
                to={ROUTES.ADMIN_PRODUCT_NEW}
                className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Start by adding products →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
