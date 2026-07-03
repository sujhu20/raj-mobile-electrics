import { useState, useEffect, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import api from '../../config/api';
import { APP_NAME, ROLES } from '../../config/constants';
import { ENDPOINTS } from '../../config/api-endpoints';
import { TableSkeleton } from '../../components/ui/Skeletons';
import toast from 'react-hot-toast';
import type { User, PaginationMeta } from '../../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [_pagination, setPagination] = useState<PaginationMeta | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await api.get(`${ENDPOINTS.USERS.ADMIN_LIST}?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { document.title = `Users — ${APP_NAME} Admin`; }, []);

  const handleRoleChange = useCallback(async (userId: string, role: string) => {
    try {
      await api.put(ENDPOINTS.USERS.ADMIN_ROLE(userId), { role });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  }, [fetchUsers]);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchQuery.trim()); }} className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700/40" size={16} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email" className="w-full h-10 pl-10 pr-4 rounded-xl border border-surface-200 text-sm outline-none focus:border-primary-400" /></div>
        <button type="submit" className="px-4 h-10 rounded-xl bg-surface-900 text-white text-sm font-medium">Search</button>
      </form>

      {loading ? <TableSkeleton rows={5} cols={6} /> : (
        <div className="bg-white rounded-2xl border border-surface-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-200/60 bg-surface-50">
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">User</th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Email</th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Phone</th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Role</th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Verified</th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-semibold text-surface-700/60 uppercase">Joined</th>
              </tr></thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-surface-700/50">No users found</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-surface-100 hover:bg-surface-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                        <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-700/70">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-surface-700/50">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        aria-label={`Role for ${user.firstName} ${user.lastName}`}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer ${user.role === ROLES.ADMIN ? 'bg-primary-100 text-primary-700' : 'bg-surface-100'}`}>
                        <option value="CUSTOMER">Customer</option><option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${user.isVerified ? 'text-success-600' : 'text-warning-600'}`}>{user.isVerified ? '✓ Yes' : 'No'}</span></td>
                    <td className="px-4 py-3 text-xs text-surface-700/50">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
