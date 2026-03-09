import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import Modal from '../../components/Modal';
import SearchFilter from '../../components/SearchFilter';
import DataTable from '../../components/tables/DataTable';
import { getPriorityClass, getStatusClass } from '../../utils/helpers';
import axiosInstance from '../../api/axiosInstance';
import { getAllUsers } from '../../services/userService';

export default function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', status: 'Pending', priority: 'Medium',
    managerId: '', managerName: '', startDate: '', deadline: '', progress: 0,
  });

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get('/projects');
      setProjects(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    getAllUsers()
      .then((res) => {
        const allUsers = res.data || res || [];
        setManagers(allUsers.filter((u) => u.role === 'manager'));
      })
      .catch((err) => console.error('Failed to fetch users:', err));
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', status: 'Pending', priority: 'Medium', managerId: '', managerName: '', startDate: '', deadline: '', progress: 0 });
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, status: p.status, priority: p.priority, managerId: p.managerId || '', managerName: p.managerName || '', startDate: p.startDate, deadline: p.deadline, progress: p.progress || 0 });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mgr = managers.find((m) => (m._id || m.id) === form.managerId);
    const payload = { ...form, managerName: mgr?.name || form.managerName || '' };
    try {
      if (editing) {
        await axiosInstance.put(`/projects/${editing._id || editing.id}`, payload);
      } else {
        await axiosInstance.post('/projects', payload);
      }
      await fetchProjects();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      try {
        await axiosInstance.delete(`/projects/${id}`);
        await fetchProjects();
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: 'name', label: 'Project', render: (v, r) => (
      <div><p className="font-medium text-gray-900 dark:text-white">{r.name}</p><p className="text-xs text-gray-500 line-clamp-1">{r.description}</p></div>
    )},
    { key: 'status', label: 'Status', render: (v) => <span className={getStatusClass(v)}>{v}</span> },
    { key: 'priority', label: 'Priority', render: (v) => <span className={getPriorityClass(v)}>{v}</span> },
    { key: 'managerName', label: 'Manager', render: (v) => v || 'Unassigned' },
    { key: 'progress', label: 'Progress', render: (v) => (
      <div className="flex items-center gap-2"><div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${v || 0}%` }} /></div><span className="text-xs">{v || 0}%</span></div>
    )},
    { key: 'deadline', label: 'Deadline' },
    { key: 'actions', label: 'Actions', render: (_, r) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><HiOutlinePencil size={16} /></button>
        <button onClick={() => handleDelete(r._id || r.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><HiOutlineTrash size={16} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all organization projects</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><HiOutlinePlus size={18} /> Add Project</button>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search projects..."
        filters={[{ key: 'status', label: 'All Status', value: statusFilter, options: ['Pending', 'In Progress', 'Completed'] }]}
        onFilterChange={(k, v) => setStatusFilter(v)}
      />

      <div className="card p-0 overflow-hidden"><DataTable columns={columns} data={filtered} /></div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editing ? 'Edit Project' : 'Add New Project'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option>Pending</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Manager</label>
              <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} className="input-field">
                <option value="">Select Manager</option>
                {managers.map((m) => <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress (%)</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
