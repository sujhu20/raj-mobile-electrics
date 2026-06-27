import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiPlus, FiEdit2, FiTrash2, FiLock } from 'react-icons/fi';
import api from '../../config/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchProfile } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'password'>('profile');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Nepal', isDefault: false });

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: (user as any).phone || '' });
    api.get('/users/me/addresses').then(r => setAddresses(r.data.data)).catch(() => {});
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      await api.put('/users/me', form);
      dispatch(fetchProfile());
      setEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await api.put('/users/me/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to change password'); }
  };

  const handleAddAddress = async () => {
    try {
      const { data } = await api.post('/users/me/addresses', addressForm);
      setAddresses([...addresses, data.data]);
      setShowAddAddress(false);
      setAddressForm({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Nepal', isDefault: false });
      toast.success('Address added');
    } catch { toast.error('Failed to add'); }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/users/me/addresses/${id}`);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: FiUser },
    { id: 'addresses' as const, label: 'Addresses', icon: FiMapPin },
    { id: 'password' as const, label: 'Password', icon: FiLock },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-surface-200/60 p-4">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center text-white text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <p className="font-bold mt-2">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-surface-700/50">{user?.email}</p>
            </div>
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-surface-50'}`}>
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-surface-200/60 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Personal Information</h2>
                {!editing && <button onClick={() => setEditing(true)} className="text-sm text-primary-600 font-medium flex items-center gap-1"><FiEdit2 size={14} /> Edit</button>}
              </div>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-surface-700 block mb-1">First Name</label><input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
                    <div><label className="text-sm font-medium text-surface-700 block mb-1">Last Name</label><input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
                  </div>
                  <div><label className="text-sm font-medium text-surface-700 block mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+977 98XXXXXXXX" className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
                  <div className="flex gap-2">
                    <button onClick={handleUpdateProfile} className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold">Save</button>
                    <button onClick={() => setEditing(false)} className="px-6 py-2.5 rounded-xl bg-surface-100 text-sm font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[{ label: 'Name', value: `${user?.firstName} ${user?.lastName}`, icon: FiUser },
                    { label: 'Email', value: user?.email, icon: FiMail },
                    { label: 'Phone', value: (user as any)?.phone || 'Not set', icon: FiPhone },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-4 p-3 bg-surface-50 rounded-xl">
                      <f.icon size={18} className="text-surface-700/40" />
                      <div><p className="text-xs text-surface-700/50">{f.label}</p><p className="font-medium text-sm">{f.value}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'addresses' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Saved Addresses</h2>
                <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-1 text-sm text-primary-600 font-medium"><FiPlus size={16} /> Add New</button>
              </div>

              {showAddAddress && (
                <div className="bg-white rounded-2xl border border-surface-200/60 p-6 space-y-3">
                  <h3 className="font-semibold">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} placeholder="Full Name" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                    <input value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} placeholder="Phone" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                  </div>
                  <input value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} placeholder="Street Address" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                  <div className="grid grid-cols-3 gap-3">
                    <input value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="City" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                    <input value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} placeholder="State" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                    <input value={addressForm.zipCode} onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})} placeholder="ZIP" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                  </div>
                  <div className="flex gap-2"><button onClick={handleAddAddress} className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium">Save</button><button onClick={() => setShowAddAddress(false)} className="px-4 py-2 rounded-lg bg-surface-100 text-sm">Cancel</button></div>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-surface-200/60 p-8 text-center"><p className="text-surface-700/50">No addresses saved</p></div>
              ) : addresses.map(addr => (
                <div key={addr.id} className="bg-white rounded-2xl border border-surface-200/60 p-5 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{addr.fullName} {addr.isDefault && <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full ml-1">Default</span>}</p>
                    <p className="text-sm text-surface-700/60 mt-1">{addr.street}, {addr.city}, {addr.state}</p>
                    <p className="text-sm text-surface-700/50">{addr.phone}</p>
                  </div>
                  <button onClick={() => setDeleteConfirmId(addr.id)} className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition"><FiTrash2 size={16} /></button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'password' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-surface-200/60 p-6">
              <h2 className="font-bold text-lg mb-4">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div><label className="text-sm font-medium block mb-1">Current Password</label><input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
                <div><label className="text-sm font-medium block mb-1">New Password</label><input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
                <div><label className="text-sm font-medium block mb-1">Confirm New Password</label><input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-primary-400" /></div>
                <button onClick={handleChangePassword} className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold">Update Password</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-surface-900">Confirm Deletion</h3>
            <p className="text-sm text-surface-700/60">Are you sure you want to delete this address? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-surface-100 text-sm font-medium text-surface-700 hover:bg-surface-200 transition">Cancel</button>
              <button type="button" onClick={async () => {
                const id = deleteConfirmId;
                setDeleteConfirmId(null);
                await handleDeleteAddress(id);
              }} className="px-4 py-2 rounded-xl bg-danger-500 text-white text-sm font-medium hover:bg-danger-600 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
