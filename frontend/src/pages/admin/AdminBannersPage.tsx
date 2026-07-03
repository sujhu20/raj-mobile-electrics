import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { CardSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { Banner } from '../../types';

const emptyForm = { title: '', subtitle: '', linkUrl: '', type: 'HERO', isActive: true, sortOrder: '0', expiresAt: '' };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.BANNERS.ADMIN_LIST);
      setBanners(data.data);
    } catch {
      toast.error('Failed to load banners');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);
  useEffect(() => { document.title = `Banners — ${APP_NAME} Admin`; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !imageFile) { toast.error('Image is required'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append('image', imageFile);
    try {
      if (editing) { await api.put(ENDPOINTS.BANNERS.ADMIN_UPDATE(editing.id), fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Updated'); }
      else { await api.post(ENDPOINTS.BANNERS.ADMIN_CREATE, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Created'); }
      setShowForm(false); setEditing(null); setImageFile(null); setForm(emptyForm); fetchBanners();
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      linkUrl: b.linkUrl || '',
      type: (b as any).type || 'HERO',
      isActive: b.isActive,
      sortOrder: String(b.sortOrder),
      expiresAt: (b as any).expiresAt ? new Date((b as any).expiresAt).toISOString().slice(0, 10) : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(ENDPOINTS.BANNERS.ADMIN_DELETE(id)); toast.success('Deleted'); fetchBanners(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm"><FiPlus size={16} /> Add Banner</button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200/60 p-6 mb-6 space-y-3">
          <h3 className="font-bold">{editing ? 'Edit Banner' : 'New Banner'}</h3>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Banner Title" required className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
          <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="Subtitle (optional)" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.linkUrl} onChange={e => setForm({...form, linkUrl: e.target.value})} placeholder="Link URL (optional)" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} aria-label="Banner type" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none"><option value="HERO">Hero</option><option value="PROMO">Promo</option><option value="CATEGORY">Category</option></select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.sortOrder} onChange={e => setForm({...form, sortOrder: e.target.value})} type="number" placeholder="Sort Order" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <input value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} type="date" aria-label="Expiry date" className="h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none" />
            <label className="flex items-center gap-2 h-11"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="accent-primary-600" /><span className="text-sm">Active</span></label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Banner Image</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-50">{submitting ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-surface-100 text-sm">Cancel</button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <CardSkeleton count={4} />
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-surface-700/50">No banners yet</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden group">
              <div className="aspect-video bg-surface-50 relative">
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button onClick={() => handleEdit(b)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 hover:bg-primary-50 transition" aria-label={`Edit ${b.title}`}><FiEdit2 size={16} /></button>
                  <button onClick={() => setDeleteConfirmId(b.id)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-danger-500 hover:bg-danger-50 transition" aria-label={`Delete ${b.title}`}><FiTrash2 size={16} /></button>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm">{b.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.isActive ? 'bg-success-500/10 text-success-600' : 'bg-surface-100 text-surface-700/50'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-surface-900">Confirm Deletion</h3>
            <p className="text-sm text-surface-700/60">Are you sure you want to delete this banner? This cannot be undone.</p>
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
