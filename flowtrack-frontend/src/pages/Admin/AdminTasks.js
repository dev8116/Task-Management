import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import { FiFile, FiSearch } from 'react-icons/fi';
import './AdminTasks.css';

const STATUS_STYLE = {
  pending: { background: '#fef9c3', color: '#854d0e' },
  'in-progress': { background: '#dbeafe', color: '#1e40af' },
  'pending-approval': { background: '#f3e8ff', color: '#7c3aed' },
  completed: { background: '#dcfce7', color: '#166534' },
  overdue: { background: '#fce4ec', color: '#c62828' },
};

const PRIORITY_STYLE = {
  low: { background: '#dcfce7', color: '#166534' },
  medium: { background: '#fef9c3', color: '#854d0e' },
  high: { background: '#ffedd5', color: '#9a3412' },
  urgent: { background: '#fee2e2', color: '#991b1b' },
};

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

  // Token-aware file fetch
  const handleViewFile = async (taskId, fallbackFilename = 'submission') => {
    const openBlob = (blobData, contentType = 'application/octet-stream', filename = 'file') => {
      const blob = new Blob([blobData], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const newTab = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newTab) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    };

    try {
      // Primary: use axios interceptor for token
      const res = await API.get(`/tasks/${taskId}/submission-file`, { responseType: 'blob' });
      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const disposition = res.headers['content-disposition'] || '';
      const match = /filename\*?=(?:UTF-8'')?\"?([^\";]+)/i.exec(disposition);
      const filename = (match && match[1]) ? match[1].replace(/['"]/g, '') : fallbackFilename;
      openBlob(res.data, contentType, filename);
      return;
    } catch (err) {
      // Fallback: manual token if interceptor failed
      if (err.response?.status === 401) {
        const raw = localStorage.getItem('flowtrack_user');
        const token = raw ? JSON.parse(raw)?.token : null;
        if (token) {
          try {
            const res = await API.get(`/tasks/${taskId}/submission-file`, {
              responseType: 'blob',
              headers: { Authorization: `Bearer ${token}` },
            });
            const contentType = res.headers['content-type'] || 'application/octet-stream';
            const disposition = res.headers['content-disposition'] || '';
            const match = /filename\*?=(?:UTF-8'')?\"?([^\";]+)/i.exec(disposition);
            const filename = (match && match[1]) ? match[1].replace(/['"]/g, '') : fallbackFilename;
            openBlob(res.data, contentType, filename);
            return;
          } catch (innerErr) {
            // fall through to generic error
          }
        }
      }
      if (err.response?.status === 404) {
        toast.error('File not found.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch file.');
        console.error('View file error:', err);
      }
    }
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
            {filteredTasks.map((t) => {
              const statusStyle = STATUS_STYLE[t.status] || { background: '#e2e8f0', color: '#475569' };
              const priorityStyle = PRIORITY_STYLE[t.priority] || { background: '#e2e8f0', color: '#475569' };
              const deadline = t.deadline || t.dueDate;
              return (
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
                    <span
                      className={`adm-badge badge-${(t.status || '').replace(/ /g, '-')}`}
                      style={statusStyle}
                    >
                      {t.status === 'pending-approval'
                        ? 'Pending Approval'
                        : t.status?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-priority priority-${t.priority || 'na'}`} style={priorityStyle}>
                      {t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '—'}
                    </span>
                  </td>
                  <td>{getEmpNames(t)}</td>
                  <td>
                    {deadline
                      ? new Date(deadline).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    {t.submissionFile?.filename ? (
                      <button
                        className="adm-btn-file"
                        onClick={() => handleViewFile(t._id, t.submissionFile.filename)}
                        title={t.submissionFile.filename}
                      >
                        <FiFile style={{ marginRight: 6 }} /> View File
                      </button>
                    ) : (
                      <span className="adm-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

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