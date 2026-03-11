import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import { FiPlus, FiUsers } from 'react-icons/fi';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee', department: '', phone: '', manager: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data);
      setManagers(data.filter((u) => u.role === 'manager'));
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      // Clear manager selection if role is not employee
      if (name === 'role' && value !== 'employee') {
        newForm.manager = '';
      }
      return newForm;
    });
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'employee', department: '', phone: '', manager: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      manager: user.manager?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        if (updateData.role !== 'employee') updateData.manager = null;
        await API.put(`/users/${editingUser._id}`, updateData);
        toast.success('User updated successfully');
      } else {
        const createData = { ...form };
        if (createData.role !== 'employee') delete createData.manager;
        await API.post('/users', createData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const toggleActive = async (user) => {
    try {
      await API.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Role',
      render: (row) => (
        <span className={`status-badge`} style={{
          background: row.role === 'admin' ? '#e3f2fd' : row.role === 'manager' ? '#f3e5f5' : '#e8f5e9',
          color: row.role === 'admin' ? '#1565c0' : row.role === 'manager' ? '#7b1fa2' : '#2e7d32',
        }}>
          {row.role}
        </span>
      ),
    },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Manager',
      render: (row) => {
        if (row.role === 'employee' && row.manager) {
          return <span className="manager-badge"><FiUsers size={12} /> {row.manager.name}</span>;
        }
        if (row.role === 'manager') {
          const teamCount = users.filter((u) => u.manager?._id === row._id).length;
          return <span className="team-count"><FiUsers size={12} /> {teamCount} members</span>;
        }
        return '--';
      },
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`status-badge ${row.isActive ? 'approved' : 'rejected'}`}
          style={{ cursor: 'pointer' }}
          onClick={() => toggleActive(row)}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <button className="add-btn" onClick={openCreate}><FiPlus /> Add User</button>
      </div>

      <DataTable
        title={`All Users (${users.length})`}
        columns={columns}
        data={users}
        actions={(row) => (
          <>
            <button className="action-btn edit" onClick={() => openEdit(row)}>Edit</button>
            <button className="action-btn delete" onClick={() => handleDelete(row._id)}>Delete</button>
          </>
        )}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter email" required />
              </div>
              <div className="form-group">
                <label>Password {editingUser && '(leave blank to keep current)'}</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                  required={!editingUser} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input name="department" value={form.department} onChange={handleChange} placeholder="Department" />
                </div>
              </div>

              {/* Manager Dropdown - Only shown for employees */}
              {form.role === 'employee' && (
                <div className="form-group">
                  <label>Assign Manager *</label>
                  <select name="manager" value={form.manager} onChange={handleChange} required>
                    <option value="">-- Select a Manager --</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.department || 'No Dept'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;