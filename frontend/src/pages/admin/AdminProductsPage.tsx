import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, CURRENCY, ROUTES } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { TableSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { Product, PaginationMeta } from '../../types';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const { data } = await api.get(`${ENDPOINTS.PRODUCTS.LIST}?${params}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { document.title = `Products — ${APP_NAME} Admin`; }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchQuery.trim());
    setPage(1);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const handleDelete = async (id: string) => {
    try {
      await api.delete(ENDPOINTS.PRODUCTS.ADMIN_DELETE(id));
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-surface-700/50">Manage your product inventory</p>
        </div>
        <Link to={ROUTES.ADMIN_PRODUCT_NEW} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition">
          <FiPlus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-200 text-sm outline-none focus:border-primary-400" />
        </div>
        <button type="submit" className="px-4 h-10 rounded-xl bg-surface-900 text-white text-sm font-medium">Search</button>
      </form>

      {/* Table */}
      {loading ? <TableSkeleton rows={5} cols={6} /> : (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200/60 bg-surface-50">
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Product</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Brand</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Price</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Stock</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Status</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-surface-700/50">No products found</td></tr>
                ) : products.map(product => (
                  <tr key={product.id} className="border-b border-surface-100 hover:bg-surface-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0]?.url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-contain bg-surface-50" />
                        <div>
                          <p className="font-medium text-sm line-clamp-1 max-w-xs">{product.name}</p>
                          <p className="text-xs text-surface-700/40">{product.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{product.brand}</td>
                    <td className="px-4 py-3 text-sm font-medium">{CURRENCY} {Number(product.price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-danger-500' : 'text-success-600'}`}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${product.isActive ? 'bg-success-500/10 text-success-600' : 'bg-surface-100 text-surface-700/50'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/products/${product.slug}`} className="p-2 rounded-lg hover:bg-surface-100 text-surface-700/60 transition" aria-label={`View ${product.name}`}><FiEye size={16} /></Link>
                        <button onClick={() => navigate(`/admin/products/${product.id}/edit`)} className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition" aria-label={`Edit ${product.name}`}><FiEdit2 size={16} /></button>
                        <button onClick={() => { setDeleteConfirmId(product.id); setDeleteConfirmName(product.name); }} className="p-2 rounded-lg hover:bg-danger-50 text-danger-500 transition" aria-label={`Delete ${product.name}`}><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
              <p className="text-xs text-surface-700/50">Showing {products.length} of {pagination.total}</p>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium ${page === i + 1 ? 'gradient-primary text-white' : 'hover:bg-surface-50'}`}>{i + 1}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-surface-200">
            <h3 className="text-lg font-bold text-surface-900">Confirm Deletion</h3>
            <p className="text-sm text-surface-700/60">Delete "{deleteConfirmName}"? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-surface-100 text-sm font-medium text-surface-700 hover:bg-surface-250 transition">Cancel</button>
              <button type="button" onClick={() => {
                const id = deleteConfirmId;
                setDeleteConfirmId(null);
                handleDelete(id);
              }} className="px-4 py-2 rounded-xl bg-danger-500 hover:bg-danger-600 text-white text-sm font-medium transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
