import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import Modal from '../../components/Modal';
import SearchFilter from '../../components/SearchFilter';
import DataTable from '../../components/tables/DataTable';
import { generateId, getStatusClass, getPriorityClass } from '../../utils/helpers';
import { mockProjects } from '../../data/mockData';

export default function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    status: 'Pending',
    priority: 'Medium',
    deadline: '',
  });

  const allUsers = JSON.parse(localStorage.getItem('flowtrack_users') || '[]');
  const myTeam = allUsers.filter((u) => u.role === 'employee' && u.managerId === user.id);
  const allProjects = JSON.parse(localStorage.getItem('flowtrack_projects') || JSON.stringify(mockProjects));
  const myProjects = allProjects.filter((p) => p.managerId === user.id);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
    const teamIds = myTeam.map((t) => t.id);
    setTasks(stored.filter((t) => teamIds.includes(t.assigneeId) || t.createdBy === user.id));
  }, [user.id]);

  const save = (updated) => {
    const allTasks = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
    const myTaskIds = updated.map((u) => u.id);
    const otherTasks = allTasks.filter((t) => !myTaskIds.includes(t.id));
    const combined = [...otherTasks, ...updated];
    localStorage.setItem('flowtrack_tasks', JSON.stringify(combined));
    setTasks(updated);
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      projectId: '',
      assigneeId: '',
      status: 'Pending',
      priority: 'Medium',
      deadline: '',
    });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const project = myProjects.find((p) => p.id === form.projectId);
    const assignee = myTeam.find((t) => t.id === form.assigneeId);

    if (editing) {
      const updated = tasks.map((t) =>
        t.id === editing.id
          ? {
              ...t,
              title: form.title,
              description: form.description,
              projectId: form.projectId,
              projectName: project?.name || '',
              assigneeId: form.assigneeId,
              assigneeName: assignee?.name || '',
              status: form.status,
              priority: form.priority,
              deadline: form.deadline,
            }
          : t
      );
      save(updated);
    } else {
      const newTask = {
        id: generateId(),
        title: form.title,
        description: form.description,
        projectId: form.projectId,
        projectName: project?.name || '',
        assigneeId: form.assigneeId,
        assigneeName: assignee?.name || '',
        status: form.status,
        priority: form.priority,
        deadline: form.deadline,
        createdBy: user.id,
        createdAt: new Date().toISOString().split('T')[0],
      };
      save([...tasks, newTask]);
    }
    setShowModal(false);
    resetForm();
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this task?')) {
      save(tasks.filter((t) => t.id !== id));
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.assigneeName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (v, r) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{r.title}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{r.description}</p>
        </div>
      ),
    },
    {
      key: 'projectName',
      label: 'Project',
      render: (v) => v || 'Unassigned',
    },
    {
      key: 'assigneeName',
      label: 'Assigned To',
      render: (v) => v || 'Unassigned',
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <span className={getStatusClass(v)}>{v}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (v) => <span className={getPriorityClass(v)}>{v}</span>,
    },
    { key: 'deadline', label: 'Deadline' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(r)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            <HiOutlinePencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and assign tasks to your team
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus size={18} /> Create Task
        </button>
      </div>

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tasks..."
        filters={[
          {
            key: 'status',
            label: 'All Status',
            value: statusFilter,
            options: ['Pending', 'In Progress', 'Completed'],
          },
        ]}
        onFilterChange={(k, v) => setStatusFilter(v)}
      />

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editing ? 'Edit Task' : 'Create New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input-field"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project
              </label>
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value })
                }
                className="input-field"
              >
                <option value="">Select Project</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign To *
              </label>
              <select
                value={form.assigneeId}
                onChange={(e) =>
                  setForm({ ...form, assigneeId: e.target.value })
                }
                className="input-field"
                required
              >
                <option value="">Select Team Member</option>
                {myTeam.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {myTeam.length === 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ⚠ No employees assigned to you. Ask admin to assign employees.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
                className="input-field"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}