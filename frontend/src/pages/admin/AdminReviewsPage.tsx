import { useState, useEffect, useCallback } from 'react';
import { FiStar, FiCheck, FiTrash2 } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { ListSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { Review } from '../../types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    try {
      const { data } = await api.get(`${ENDPOINTS.REVIEWS.ADMIN_LIST}${params}`);
      setReviews(data.data);
    } catch {
      toast.error('Failed to load reviews');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { document.title = `Reviews — ${APP_NAME} Admin`; }, []);

  const handleApprove = useCallback(async (id: string) => {
    try { await api.put(ENDPOINTS.REVIEWS.ADMIN_APPROVE(id)); toast.success('Approved'); fetchReviews(); }
    catch { toast.error('Failed'); }
  }, [fetchReviews]);

  const handleDelete = useCallback(async (id: string) => {
    try { await api.delete(ENDPOINTS.REVIEWS.ADMIN_DELETE(id)); toast.success('Deleted'); fetchReviews(); }
    catch { toast.error('Failed'); }
  }, [fetchReviews]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reviews</h1>
      <div className="flex gap-2 mb-6">
        {['', 'pending', 'approved'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === s ? 'gradient-primary text-white' : 'bg-white border border-surface-200'}`}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? <ListSkeleton count={3} /> :
        reviews.length === 0 ? <div className="text-center py-12 text-surface-700/50">No reviews</div> : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-surface-200/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">{review.user?.firstName?.[0]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{review.user?.firstName} {review.user?.lastName}</p>
                    <p className="text-xs text-surface-700/50 truncate">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!review.isApproved && (
                    <button onClick={() => handleApprove(review.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success-500/10 text-success-600 text-xs font-medium hover:bg-success-500/20 transition" aria-label="Approve review"><FiCheck size={14} /> Approve</button>
                  )}
                  <button onClick={() => setDeleteConfirmId(review.id)} className="p-2 rounded-lg hover:bg-danger-50 text-danger-500 transition" aria-label="Delete review"><FiTrash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-surface-700/50 mb-1">Product: <span className="text-primary-600 font-medium">{review.product?.name}</span></p>
                <div className="flex items-center gap-1 mb-1" aria-label={`Rating: ${review.rating} out of 5`}>{[...Array(5)].map((_, i) => <FiStar key={i} size={14} className={i < review.rating ? 'text-warning-500 fill-warning-500' : 'text-surface-200'} />)}</div>
                {review.title && <p className="font-semibold text-sm">{review.title}</p>}
                <p className="text-sm text-surface-700/70 mt-1">{review.comment}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${review.isApproved ? 'bg-success-500/10 text-success-600' : 'bg-warning-500/10 text-warning-600'}`}>{review.isApproved ? 'Approved' : 'Pending'}</span>
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
            <p className="text-sm text-surface-700/60">Are you sure you want to delete this review? This cannot be undone.</p>
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
