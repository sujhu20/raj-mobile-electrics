import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { ListSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { Category } from '../../types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(ENDPOINTS.CATEGORIES.LIST);
      setCategories(data.data);
    } catch {
      toast.error('Failed to load categories');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { document.title = `Categories — ${APP_NAME} Admin`; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(ENDPOINTS.CATEGORIES.ADMIN_UPDATE(editing.id), { name: form.name, description: form.description, parentId: form.parentId || null });
        toast.success('Category updated');
      } else {
        await api.post(ENDPOINTS.CATEGORIES.ADMIN_CREATE, { name: form.name, description: form.description, parentId: form.parentId || null });
        toast.success('Category created');
      }
      setShowForm(false); setEditing(null); setForm({ name: '', description: '', parentId: '' }); fetchCategories();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', parentId: cat.parentId || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(ENDPOINTS.CATEGORIES.ADMIN_DELETE(id));
      toast.success('Deleted');
      fetchCategories();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', parentId: '' }); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm"><FiPlus size={16} /> Add Category</button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-surface-200/60 p-6 mb-6 space-y-3">
          <h3 className="font-bold">{editing ? 'Edit Category' : 'New Category'}</h3>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Category name" required className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description (optional)" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" />
          <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} aria-label="Parent category" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400">
            <option value="">No Parent (Top Level)</option>
            {categories.filter(c => c.id !== editing?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-50">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-6 py-2.5 rounded-xl bg-surface-100 text-sm font-medium">Cancel</button>
          </div>
        </motion.form>
      )}

      {loading ? <ListSkeleton count={4} /> : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200/60 p-8 text-center text-surface-700/50">No categories yet</div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden divide-y divide-surface-100">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-50/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600"><FiFolder size={18} /></div>
                <div>
                  <p className="font-semibold text-sm">{cat.name}</p>
                  <p className="text-xs text-surface-700/50">{cat.slug} • {cat._count?.products || 0} products</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(cat)} className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition" aria-label={`Edit ${cat.name}`}><FiEdit2 size={16} /></button>
                <button onClick={() => { setDeleteConfirmId(cat.id); setDeleteConfirmName(cat.name); }} className="p-2 rounded-lg hover:bg-danger-50 text-danger-500 transition" aria-label={`Delete ${cat.name}`}><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-surface-900">Confirm Deletion</h3>
            <p className="text-sm text-surface-700/60">Are you sure you want to delete category "{deleteConfirmName}"? This cannot be undone.</p>
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
