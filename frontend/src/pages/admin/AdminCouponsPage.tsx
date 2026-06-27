import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, CURRENCY } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { ListSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { Coupon } from '../../types';

const emptyForm = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '', isActive: true };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.COUPONS.ADMIN_LIST);
      setCoupons(data.data);
    } catch {
      toast.error('Failed to load coupons');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);
  useEffect(() => { document.title = `Coupons — ${APP_NAME} Admin`; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error('Coupon code is required'); return; }
    if (!form.value || Number(form.value) <= 0) { toast.error('Value must be positive'); return; }
    setSubmitting(true);
    const payload = { ...form, value: Number(form.value), minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined, maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined };
    try {
      if (editing) { await api.put(ENDPOINTS.COUPONS.ADMIN_UPDATE(editing.id), payload); toast.success('Updated'); }
      else { await api.post(ENDPOINTS.COUPONS.ADMIN_CREATE, payload); toast.success('Created'); }
      setShowForm(false); setEditing(null); setForm(emptyForm); fetchCoupons();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, description: c.description || '', type: c.discountType, value: String(c.discountValue), minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : '', maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '', expiresAt: c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : '', isActive: c.isActive });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(ENDPOINTS.COUPONS.ADMIN_DELETE(id)); toast.success('Deleted'); fetchCoupons(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm"><FiPlus size={16} /> Add Coupon</button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200/60 p-6 mb-6 space-y-3">
          <h3 className="font-bold">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="COUPON CODE" required className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm uppercase outline-none focus:border-primary-400" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} aria-label="Discount type" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none"><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed Amount ({CURRENCY})</option></select>
          </div>
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={form.value} onChange={e => setForm({...form, value: e.target.value})} type="number" placeholder="Value" required className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <input value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} type="number" placeholder="Min Order" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <input value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value})} type="number" placeholder="Max Discount" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <input value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} type="number" placeholder="Usage Limit" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} type="date" aria-label="Expiry date" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <label className="flex items-center gap-2 h-11"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="accent-primary-600" /><span className="text-sm">Active</span></label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-surface-100 text-sm">Cancel</button>
          </div>
        </motion.form>
      )}

      {loading ? <ListSkeleton count={4} /> : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200/60 p-8 text-center text-surface-700/50">No coupons yet</div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden divide-y divide-surface-100">
          {coupons.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-50/50 transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0"><FiTag size={18} /></div>
                <div className="min-w-0">
                  <p className="font-bold text-sm font-mono">{c.code} <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.isActive ? 'bg-success-500/10 text-success-600' : 'bg-surface-100 text-surface-700/50'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></p>
                  <p className="text-xs text-surface-700/50 truncate">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `${CURRENCY} ${c.discountValue} off`} • Used {c.usedCount}/{c.usageLimit || '∞'} • Expires {new Date(c.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleEdit(c)} className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition" aria-label={`Edit ${c.code}`}><FiEdit2 size={16} /></button>
                <button onClick={() => setDeleteConfirmId(c.id)} className="p-2 rounded-lg hover:bg-danger-50 text-danger-500 transition" aria-label={`Delete ${c.code}`}><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-surface-900">Confirm Deletion</h3>
            <p className="text-sm text-surface-700/60">Are you sure you want to delete this coupon? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-surface-100 text-sm font-medium text-surface-700 hover:bg-surface-200 transition">Cancel</button>
              <button type="button" onClick={async () => {
                const id = deleteConfirmId;
                setDeleteConfirmId(null);
                await handleDelete(id);
              }} className="px-4 py-2 rounded-xl bg-danger-500 text-white text-sm font-medium hover:bg-danger-600 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
