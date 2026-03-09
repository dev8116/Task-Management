import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import Modal from '../../components/Modal';
import SearchFilter from '../../components/SearchFilter';
import DataTable from '../../components/tables/DataTable';
import { getInitials } from '../../utils/helpers';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../services/userService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', department: '', role: 'employee' });

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const managers = users.filter((u) => u.role === 'manager');
  const resetForm = () => { setForm({ name: '', email: '', password: '', phone: '', department: '', role: 'employee' }); setEditingUser(null); setError(''); };
  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', department: user.department || '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setError('');
    try {
      if (editingUser) {
        await updateUser(editingUser._id || editingUser.id, { name: form.name, department: form.department, role: form.role, phone: form.phone });
      } else {
        if (!form.password) { setError('Password is required'); return; }
        await createUser({ name: form.name, email: form.email, password: form.password, department: form.department, role: form.role });
      }
      await fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        await fetchUsers();
      } catch (err) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const columns = [
    {
      key: 'name', label: 'User',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">{getInitials(row.name)}</div>
          <div><p className="font-medium text-gray-900 dark:text-white">{row.name}</p><p className="text-xs text-gray-500">{row.email}</p></div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role',
      render: (val) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${val === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : val === 'manager' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
          {val?.charAt(0).toUpperCase() + val?.slice(1)}
        </span>
      ),
    },
    { key: 'department', label: 'Department' },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><HiOutlinePencil size={16} /></button>
          <button onClick={() => handleDelete(row._id || row.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><HiOutlineTrash size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage managers and employees</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><HiOutlinePlus size={18} /> Add User</button>
      </div>
      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search users..." filters={[{ key: 'role', label: 'All Roles', value: roleFilter, options: ['Admin', 'Manager', 'Employee'] }]} onFilterChange={(key, val) => setRoleFilter(val)} />
      <div className="card p-0 overflow-hidden"><DataTable columns={columns} data={filtered} /></div>
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingUser ? 'Edit User' : 'Add New User'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required disabled={!!editingUser} /></div>
            {!editingUser && (<div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required /></div>)}
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label><input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field"><option value="employee">Employee</option><option value="manager">Manager</option></select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingUser ? 'Update User' : 'Create User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
