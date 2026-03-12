import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import { FiFile, FiSearch } from 'react-icons/fi';

// Status badge colours
const STATUS_STYLE = {
  'pending':          { background: '#fff8e1', color: '#f59e0b' },
  'in-progress':      { background: '#e0f2fe', color: '#0284c7' },
  'pending-approval': { background: '#f3e8ff', color: '#7c3aed' },
  'completed':        { background: '#e8f5e9', color: '#2e7d32' },
  'overdue':          { background: '#fce4ec', color: '#c62828' },
};

const PRIORITY_STYLE = {
  'low':    { background: '#f0fdf4', color: '#15803d' },
  'medium': { background: '#fefce8', color: '#a16207' },
  'high':   { background: '#fff7ed', color: '#c2410c' },
  'urgent': { background: '#fef2f2', color: '#dc2626' },
};

const AdminTasks = () => {
  const [tasks, setTasks]       = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res  = await API.get('/tasks');
      const data = res.data?.data ?? res.data;
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ── View / download submitted file ──
  const handleViewFile = (taskId) => {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.open(`${base}/tasks/${taskId}/submission-file`, '_blank');
  };

  const getEmpName = (task) => {
    if (task.assignedEmployees?.length > 0)
      return task.assignedEmployees.map((e) => (typeof e === 'object' ? e.name : e)).join(', ');
    if (task.assignedTo)
      return typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo;
    return 'N/A';
  };

  const getProjectName = (task) => {
    if (!task.project) return 'N/A';
    return task.project.name || task.project.title || 'N/A';
  };

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      getEmpName(t).toLowerCase().includes(q) ||
      getProjectName(t).toLowerCase().includes(q)
    );
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading tasks...</div>;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>All Tasks</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
          padding: '8px 12px', width: '260px',
        }}>
          <FiSearch style={{ color: '#94a3b8' }} />
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '14px', flex: 1, background: 'transparent' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>Tasks ({filtered.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Title', 'Project', 'Assigned To', 'Priority', 'Status', 'Deadline', 'Submission File'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    fontSize: '12px', fontWeight: 600, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const statusStyle   = STATUS_STYLE[t.status]   || { background: '#f1f5f9', color: '#64748b' };
                const priorityStyle = PRIORITY_STYLE[t.priority] || { background: '#f1f5f9', color: '#64748b' };
                const deadline      = t.deadline || t.dueDate;
                const isOverdue     = deadline && new Date(deadline) < new Date() &&
                                      !['completed', 'pending-approval'].includes(t.status);

                return (
                  <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Title */}
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ fontSize: '14px' }}>{t.title}</strong>
                      {t.description && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0', maxWidth: '200px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </p>
                      )}
                    </td>

                    {/* Project */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                      {getProjectName(t)}
                    </td>

                    {/* Assigned To */}
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                      {getEmpName(t)}
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        ...priorityStyle,
                        padding: '3px 10px', borderRadius: '12px',
                        fontSize: '11px', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {t.priority?.toUpperCase() || 'N/A'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        ...statusStyle,
                        padding: '4px 12px', borderRadius: '12px',
                        fontSize: '12px', fontWeight: 500,
                      }}>
                        {t.status === 'pending-approval'
                          ? '⏳ Pending Approval'
                          : t.status?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'N/A'}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: '14px 16px', fontSize: '13px',
                                 color: isOverdue ? '#c62828' : '#64748b', fontWeight: isOverdue ? 600 : 400 }}>
                      {deadline
                        ? new Date(deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A'}
                      {isOverdue && <span style={{ marginLeft: 4, fontSize: '11px' }}>⚠ Overdue</span>}
                    </td>

                    {/* ✅ Submission File column */}
                    <td style={{ padding: '14px 16px' }}>
                      {t.submissionFile?.filename ? (
                        <button
                          onClick={() => handleViewFile(t._id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: '8px',
                            background: '#eff6ff', color: '#1d4ed8',
                            border: '1px solid #bfdbfe', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 500,
                          }}
                          title={`View: ${t.submissionFile.filename}`}
                        >
                          <FiFile size={13} /> View File
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    {tasks.length === 0 ? 'No tasks created yet.' : 'No tasks match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTasks;