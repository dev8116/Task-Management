import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import { FiFile, FiSearch } from 'react-icons/fi';
import './AdminTasks.css';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', project: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [taskRes, projRes] = await Promise.all([API.get('/tasks'), API.get('/projects')]);
      const taskData = taskRes.data?.data ?? taskRes.data;
      const projData = projRes.data?.data ?? projRes.data;
      setTasks(Array.isArray(taskData) ? taskData : []);
      setProjects(Array.isArray(projData) ? projData : []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getEmpNames = (task) => {
    if (task.assignedEmployees?.length > 0) {
      return task.assignedEmployees
        .map((e) => (typeof e === 'object' ? e.name : e))
        .filter(Boolean)
        .join(', ');
    }
    if (task.assignedTo) {
      return typeof task.assignedTo === 'object'
        ? task.assignedTo.name || ''
        : task.assignedTo;
    }
    return '—';
  };

  const handleViewFile = (taskId) => {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.open(`${base}/tasks/${taskId}/submission-file`, '_blank');
  };

  const matchesFilters = (t) => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.project && t.project?._id !== filter.project) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        t.title,
        getEmpNames(t),
        t.project?.name,
        t.project?.title,
        t.priority,
        t.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  const filteredTasks = tasks.filter(matchesFilters);

  if (loading) return <div className="adm-loading">Loading tasks...</div>;

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div>
          <h2 className="adm-title">All Tasks</h2>
          <p className="adm-subtitle">View every task with filters—no create or reassign actions.</p>
        </div>
        <div className="adm-search">
          <FiSearch className="adm-search-icon" />
          <input
            placeholder="Search by title, assignee, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="adm-filters">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="pending-approval">Pending Approval</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filter.project}
          onChange={(e) => setFilter({ ...filter, project: e.target.value })}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name || p.title}
            </option>
          ))}
        </select>

        {(filter.status || filter.priority || filter.project || search) && (
          <button
            className="adm-btn-secondary"
            onClick={() => {
              setFilter({ status: '', priority: '', project: '' });
              setSearch('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="adm-table-wrapper">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Deadline</th>
              <th>Submission</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => (
              <tr key={t._id}>
                <td>
                  <strong>{t.title}</strong>
                  {t.description && (
                    <div className="adm-desc" title={t.description}>
                      {t.description}
                    </div>
                  )}
                </td>
                <td>{t.project?.name || t.project?.title || '—'}</td>
                <td>
                  <span className={`adm-badge badge-${(t.status || '').replace(/ /g, '-')}`}>
                    {t.status === 'pending-approval'
                      ? 'Pending Approval'
                      : t.status?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'}
                  </span>
                </td>
                <td>
                  <span className={`adm-priority priority-${t.priority || 'na'}`}>
                    {t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '—'}
                  </span>
                </td>
                <td>{getEmpNames(t)}</td>
                <td>
                  {t.deadline
                    ? new Date(t.deadline).toLocaleDateString()
                    : t.dueDate
                    ? new Date(t.dueDate).toLocaleDateString()
                    : '—'}
                </td>
                <td>
                  {t.submissionFile?.filename ? (
                    <button
                      className="adm-btn-file"
                      onClick={() => handleViewFile(t._id)}
                      title={t.submissionFile.filename}
                    >
                      <FiFile style={{ marginRight: 6 }} /> View File
                    </button>
                  ) : (
                    <span className="adm-muted">—</span>
                  )}
                </td>
              </tr>
            ))}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="7" className="adm-empty">
                  {tasks.length === 0 ? 'No tasks available.' : 'No tasks match the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTasks;