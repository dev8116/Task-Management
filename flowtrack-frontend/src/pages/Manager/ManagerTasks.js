import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import {
  FiPlus, FiX, FiFile, FiCheckCircle, FiXCircle, FiZap,
  FiEdit2, FiTrash2
} from 'react-icons/fi';
import './ManagerTasks.css';

// ── Demo Task Templates ────────────────────────────────────────────────
// All values match backend enums EXACTLY (all lowercase):
//   status:   'pending' | 'in-progress'
//   priority: 'low' | 'medium' | 'high' | 'urgent'
const DEMO_TASKS = [
  {
    label: '🐛 Bug Fix',
    title: 'Fix critical bug in production',
    description: 'Identify and resolve the critical bug reported by the client. Test thoroughly before marking complete.',
    priority: 'urgent',
    status: 'pending',
  },
  {
    label: '🎨 UI Design',
    title: 'Design new dashboard UI',
    description: 'Create a clean and modern dashboard layout. Follow the existing design system and brand guidelines.',
    priority: 'medium',
    status: 'pending',
  },
  {
    label: '📄 Documentation',
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with request/response examples using the standard format.',
    priority: 'low',
    status: 'pending',
  },
  {
    label: '🔍 Code Review',
    title: 'Review and test new feature branch',
    description: 'Review the pull request, run tests, check for edge cases, and provide detailed feedback.',
    priority: 'medium',
    status: 'in-progress',
  },
  {
    label: '🚀 Feature Development',
    title: 'Develop new user authentication module',
    description: 'Implement login, registration, password reset, and JWT token management for the new module.',
    priority: 'high',
    status: 'pending',
  },
  {
    label: '🧪 Testing',
    title: 'Write unit tests for core functions',
    description: 'Write comprehensive unit tests covering all edge cases. Aim for minimum 80% code coverage.',
    priority: 'medium',
    status: 'pending',
  },
  {
    label: '📊 Report',
    title: 'Prepare weekly performance report',
    description: 'Compile task completion stats, attendance summary, and key highlights for the weekly review meeting.',
    priority: 'low',
    status: 'pending',
  },
  {
    label: '🔧 Setup',
    title: 'Configure deployment pipeline',
    description: 'Set up CI/CD pipeline for automated testing and deployment to staging and production environments.',
    priority: 'high',
    status: 'pending',
  },
];

export default function ManagerTasks() {
  const [tasks, setTasks]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // ── Create Task modal ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', project: '',
    priority: 'medium',   // ✅ lowercase — matches enum
    deadline: '',
    status: 'pending',    // ✅ lowercase — matches enum
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [creating, setCreating]                 = useState(false);
  const [showDemoMenu, setShowDemoMenu]         = useState(false);
  const [aiTaskLoading, setAiTaskLoading]       = useState(false);

  // Demo-only controls
  const [allowNoProject, setAllowNoProject] = useState(false); // shows checkbox
  const [useNoProject, setUseNoProject]     = useState(false); // checkbox value

  // ── Assign Employee modal ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTask, setAssigningTask]     = useState(null);
  const [assignEmpId, setAssignEmpId]         = useState('');

  // ── Review Submission modal ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingTask, setReviewingTask]     = useState(null);
  const [rejectNote, setRejectNote]           = useState('');
  const [reviewing, setReviewing]             = useState(false);

  // ── Edit Task modal ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask]     = useState(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', project: '',
    priority: 'medium',
    deadline: '',
    status: 'pending',
  });
  const [editing, setEditing]             = useState(false);

  // ── Filter ──
  const [filter, setFilter] = useState({ status: '', priority: '', project: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [taskRes, projRes, teamRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/projects'),
        API.get('/users/my-team'),
      ]);
      const tasks    = taskRes.data?.data ?? taskRes.data;
      const projects = projRes.data?.data ?? projRes.data;
      const team     = teamRes.data?.data ?? teamRes.data;
      setTasks(Array.isArray(tasks)       ? tasks    : []);
      setProjects(Array.isArray(projects) ? projects : []);
      setEmployees(Array.isArray(team)    ? team     : []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', project: '',
      priority: 'medium',   // ✅ lowercase
      deadline: '',
      status: 'pending',    // ✅ lowercase
    });
    setSelectedEmployee('');
    setShowDemoMenu(false);
    setAllowNoProject(false);
    setUseNoProject(false);
  };

  const generateTaskSuggestion = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter task title first');
      return;
    }
    setAiTaskLoading(true);
    try {
      const projectName = projects.find((p) => p._id === form.project)?.name || '';
      const { data } = await API.post('/ai/task-suggestion', {
        title: form.title,
        description: form.description,
        projectName,
      });
      setForm((prev) => ({
        ...prev,
        description: data.suggestion || prev.description,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI suggestion failed');
    } finally {
      setAiTaskLoading(false);
    }
  };

  // ── Apply Demo Template ──
  // Values already match backend enum (all lowercase)
  const applyDemo = (demo) => {
    setForm((prev) => ({
      ...prev,
      title:       demo.title,
      description: demo.description,
      priority:    demo.priority,  // already lowercase: 'low'|'medium'|'high'|'urgent'
      status:      demo.status,    // already lowercase: 'pending'|'in-progress'
      project:     '',             // clear project to enable no-project flow
    }));
    setAllowNoProject(true);
    setUseNoProject(true); // default to skipping project after demo
    setShowDemoMenu(false);
    toast.info(`Template applied: ${demo.label}`);
  };

  // ── Create Task ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required');
    if (!useNoProject && !form.project) return toast.error('Please select a project');
    if (!selectedEmployee)  return toast.error('Please assign an employee');
    if (!form.deadline)     return toast.error('Please set a deadline');

    setCreating(true);
    try {
      await API.post('/tasks', {
        title:             form.title,
        description:       form.description,
        project:           useNoProject ? null : form.project,
        assignedTo:        selectedEmployee,
        assignedEmployees: [selectedEmployee],
        priority:          form.priority,  // 'low'|'medium'|'high'|'urgent'
        dueDate:           form.deadline,
        deadline:          form.deadline,
        status:            form.status,    // 'pending'|'in-progress'
      });
      toast.success('Task created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  // ── Assign Employee (existing task) ──
  const openAssignModal = (task) => {
    setAssigningTask(task);
    const cur = task.assignedEmployees?.[0] ?? task.assignedTo;
    setAssignEmpId(typeof cur === 'object' ? cur?._id ?? '' : cur ?? '');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignEmpId) return toast.error('Please select an employee');
    try {
      await API.put(`/tasks/${assigningTask._id}`, {
        assignedTo:        assignEmpId,
        assignedEmployees: [assignEmpId],
      });
      toast.success('Employee assigned!');
      setShowAssignModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    }
  };

  // ── Review Submission ──
  const openReviewModal = (task) => {
    setReviewingTask(task);
    setRejectNote('');
    setShowReviewModal(true);
  };

  const handleReview = async (decision) => {
    setReviewing(true);
    try {
      await API.patch(`/tasks/${reviewingTask._id}/review-submission`, {
        decision,
        note: rejectNote,
      });
      toast.success(
        decision === 'approved'
          ? '✅ Task approved & completed!'
          : '❌ Submission rejected.'
      );
      setShowReviewModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  // ── View / Download submission file
  const handleViewFile = async (taskId, fallbackFilename) => {
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
      const response = await API.get(`/tasks/${taskId}/submission-file`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const disposition = response.headers['content-disposition'] || '';
      let filename = fallbackFilename || '';
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(disposition);
      if (match && match[1]) filename = match[1].replace(/['"]/g, '');
      if (!filename) filename = fallbackFilename || `submission-${taskId}`;
      openBlob(response.data, contentType, filename);
      return;
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const raw = localStorage.getItem('flowtrack_user');
          const token = raw ? JSON.parse(raw)?.token : null;
          if (token) {
            const response = await API.get(`/tasks/${taskId}/submission-file`, {
              responseType: 'blob',
              headers: { Authorization: `Bearer ${token}` },
            });
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            const disposition = response.headers['content-disposition'] || '';
            let filename = fallbackFilename || '';
            const match = /filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(disposition);
            if (match && match[1]) filename = match[1].replace(/['"]/g, '');
            if (!filename) filename = fallbackFilename || `submission-${taskId}`;
            openBlob(response.data, contentType, filename);
            return;
          }
        } catch (innerErr) {
          console.error('Manual header retry failed', innerErr);
        }
        toast.error(err.response?.data?.message || 'Not authorized. Please login again.');
        localStorage.removeItem('flowtrack_user');
        window.location.href = '/login';
        return;
      }

      if (err.response?.status === 404) {
        toast.error(err.response?.data?.message || 'File not found.');
        return;
      }

      console.error('Failed to fetch submission file', err);
      toast.error('Failed to fetch file. See console for details.');
    }
  };

  // ── Edit Task ──
  const openEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      project: task.project?._id || '',
      priority: task.priority || 'medium',
      deadline: task.deadline
        ? task.deadline.slice(0, 10)
        : task.dueDate
        ? task.dueDate.slice(0, 10)
        : '',
      status: task.status || 'pending',
    });
    const cur = task.assignedEmployees?.[0] ?? task.assignedTo;
    setSelectedEmployee(typeof cur === 'object' ? cur?._id ?? '' : cur ?? '');
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return toast.error('Task title is required');
    if (!selectedEmployee)      return toast.error('Please assign an employee');
    if (!editForm.deadline)     return toast.error('Please set a deadline');

    setEditing(true);
    try {
      await API.put(`/tasks/${editingTask._id}`, {
        title:             editForm.title,
        description:       editForm.description,
        project:           editForm.project || null,
        assignedTo:        selectedEmployee,
        assignedEmployees: [selectedEmployee],
        priority:          editForm.priority,
        dueDate:           editForm.deadline,
        deadline:          editForm.deadline,
        status:            editForm.status,
      });
      toast.success('Task updated!');
      setShowEditModal(false);
      setEditingTask(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setEditing(false);
    }
  };

  // ── Delete Task ──
  const handleDelete = async (taskId, title) => {
    const ok = window.confirm(`Delete task "${title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
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
    return '';
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter.status   && t.status    !== filter.status)     return false;
    if (filter.priority && t.priority  !== filter.priority)   return false;
    if (filter.project  && t.project?._id !== filter.project) return false;
    return true;
  });

  if (loading) return <div className="mgrtasks-loading">Loading tasks...</div>;

  return (
    <div className="mgrtasks-container">

      {/* ── Header ── */}
      <div className="mgrtasks-header">
        <h2 className="mgrtasks-title">Manage Tasks</h2>
        <button
          className="mgrtask-btn btn-primary"
          onClick={() => { resetForm(); setShowCreateModal(true); }}
        >
          <FiPlus style={{ marginRight: 6 }} /> Create Task
        </button>
      </div>

      {/* ── No team warning ── */}
      {employees.length === 0 && (
        <div className="mgrtasks-warning">
          ⚠️ No team members found. Ask the Admin to assign employees to your team first.
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mgrtasks-filters">
        {/* status values must match enum: 'pending'|'in-progress'|'pending-approval'|'completed' */}
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

        {/* priority values must match enum: 'low'|'medium'|'high'|'urgent' */}
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
            <option key={p._id} value={p._id}>{p.name || p.title}</option>
          ))}
        </select>

        {(filter.status || filter.priority || filter.project) && (
          <button
            className="mgrtask-btn btn-secondary"
            onClick={() => setFilter({ status: '', priority: '', project: '' })}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Task Table ── */}
      <div className="mgrtasks-table-wrapper">
        <table className="mgrtasks-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Deadline</th>
              <th>Submission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const empNames = getEmpNames(t);
              const isCompleted = t.status === 'completed';
              return (
                <tr key={t._id}>
                  <td><strong>{t.title}</strong></td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {t.project?.name || t.project?.title || '—'}
                  </td>
                  <td>
                    <span className={`mgr-badge badge-${(t.status || '').replace(/ /g, '-')}`}>
                      {t.status === 'pending-approval'
                        ? '⏳ Pending Approval'
                        : t.status?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td>
                    <span className={`mgr-priority priority-${t.priority}`}>
                      {t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)}
                    </span>
                  </td>
                  <td>{empNames || '—'}</td>
                  <td style={{ fontSize: '13px' }}>
                    {t.deadline
                      ? new Date(t.deadline).toLocaleDateString()
                      : t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    {t.submissionFile?.filename ? (
                      <button
                        className="mgrtask-btn btn-file"
                        onClick={() => handleViewFile(t._id, t.submissionFile.filename)}
                        title={t.submissionFile.filename}
                      >
                        <FiFile style={{ marginRight: 4 }} /> View File
                      </button>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="mgr-actions">
                      {!isCompleted && (
                        <button
                          className="mgrtask-btn btn-secondary"
                          onClick={() => openAssignModal(t)}
                        >
                          {empNames ? 'Re-assign' : 'Assign'}
                        </button>
                      )}
                      <button
                        className="mgrtask-btn btn-secondary"
                        onClick={() => openEditModal(t)}
                        disabled={isCompleted}
                        title={isCompleted ? 'Completed tasks cannot be edited' : 'Edit task'}
                      >
                        <FiEdit2 style={{ marginRight: 4 }} /> Edit
                      </button>
                      <button
                        className="mgrtask-btn btn-danger"
                        onClick={() => handleDelete(t._id, t.title)}
                        disabled={isCompleted}
                        title={isCompleted ? 'Completed tasks cannot be deleted' : 'Delete task'}
                      >
                        <FiTrash2 style={{ marginRight: 4 }} /> Delete
                      </button>
                      {t.status === 'pending-approval' && (
                        <button
                          className="mgrtask-btn btn-review"
                          onClick={() => openReviewModal(t)}
                        >
                          Review
                        </button>
                      )}
                      {isCompleted && (
                        <span className="mgr-done">✅ Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#aaa', padding: '32px' }}>
                  {tasks.length === 0
                    ? 'No tasks yet. Click "Create Task" to add one.'
                    : 'No tasks match the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════
          CREATE TASK MODAL
      ══════════════════════════════════════════════ */}
      {showCreateModal && (
        <div
          className="mgr-modal-overlay"
          onClick={() => { setShowCreateModal(false); resetForm(); }}
        >
          <div className="mgr-modal-box mgr-modal-lg" onClick={(e) => e.stopPropagation()}>

            <div className="mgr-modal-header">
              <h3><FiPlus style={{ marginRight: 6 }} /> Create Task</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                {/* ⚡ Demo Task */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="mgrtask-btn btn-demo"
                    onClick={() => setShowDemoMenu((v) => !v)}
                  >
                    <FiZap style={{ marginRight: 5 }} /> Demo Task
                  </button>
                  {showDemoMenu && (
                    <div className="demo-dropdown">
                      <p className="demo-dropdown-title">Choose a template:</p>
                      {DEMO_TASKS.map((demo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="demo-dropdown-item"
                          onClick={() => applyDemo(demo)}
                        >
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="mgr-modal-close"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                >
                  <FiX />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="mgr-modal-body">

              {/* Title */}
              <div className="mgr-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="mgr-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <button
                  type="button"
                  className="mgrtask-btn btn-secondary"
                  onClick={generateTaskSuggestion}
                  disabled={aiTaskLoading}
                >
                  {aiTaskLoading ? 'Generating...' : 'AI Suggest Details'}
                </button>
              </div>

              {/* Project */}
              <div className="mgr-form-group">
                <label>
                  Project *
                  {projects.length === 0 && (
                    <span style={{ color: '#ef6c00', fontSize: '12px', marginLeft: 8 }}>
                      (No projects — contact admin)
                    </span>
                  )}
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <select
                    value={form.project}
                    onChange={(e) => { setForm({ ...form, project: e.target.value }); setUseNoProject(false); }}
                    required={!useNoProject}
                    disabled={projects.length === 0 || useNoProject}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.title}{p.status ? ` (${p.status})` : ''}
                      </option>
                    ))}
                  </select>

                  {allowNoProject && (
                    <label style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={useNoProject}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseNoProject(checked);
                          if (checked) setForm((prev) => ({ ...prev, project: '' }));
                        }}
                      />
                      Create this demo task without a project
                    </label>
                  )}
                </div>
              </div>

              {/* Assign Employee */}
              <div className="mgr-form-group">
                <label>
                  Assign Employee *
                  {employees.length === 0 && (
                    <span style={{ color: '#ef6c00', fontSize: '12px', marginLeft: 8 }}>
                      (No team members — contact admin)
                    </span>
                  )}
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required
                  disabled={employees.length === 0}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}{emp.department ? ` — ${emp.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Status — enum: 'pending' | 'in-progress' */}
              <div className="mgr-form-group">
                <label>
                  Initial Status{' '}
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    (you cannot change this later)
                  </span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                </select>
              </div>

              {/* Priority + Deadline */}
              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="mgr-form-group">
                  <label>Deadline *</label>
                  <input
                    type="date"
                    value={form.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mgr-modal-footer">
                <button
                  type="button"
                  className="mgrtask-btn btn-secondary"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgrtask-btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ASSIGN EMPLOYEE MODAL
      ══════════════════════════════════════════════ */}
      {showAssignModal && assigningTask && (
        <div className="mgr-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="mgr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3>Assign Employee — {assigningTask.title}</h3>
              <button className="mgr-modal-close" onClick={() => setShowAssignModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="mgr-modal-body">
              {employees.length === 0 ? (
                <p style={{ color: '#ef6c00', fontSize: '14px' }}>
                  ⚠️ No team members. Ask Admin to assign employees to your team.
                </p>
              ) : (
                <div className="mgr-form-group">
                  <label>Select Employee</label>
                  <select
                    value={assignEmpId}
                    onChange={(e) => setAssignEmpId(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}{emp.department ? ` — ${emp.department}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mgr-modal-footer">
              <button className="mgrtask-btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button
                className="mgrtask-btn btn-primary"
                onClick={handleAssign}
                disabled={!assignEmpId || employees.length === 0}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          REVIEW SUBMISSION MODAL
      ══════════════════════════════════════════════ */}
      {showReviewModal && reviewingTask && (
        <div className="mgr-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="mgr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3><FiFile style={{ marginRight: 6 }} />Review — {reviewingTask.title}</h3>
              <button className="mgr-modal-close" onClick={() => setShowReviewModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="mgr-modal-body">
              <p style={{ marginBottom: 12, color: '#555', fontSize: '14px' }}>
                Submitted by: <strong>{getEmpNames(reviewingTask) || '—'}</strong>
              </p>
              {reviewingTask.submissionFile?.filename ? (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '14px' }}>
                    Submitted File:
                  </p>
                  <button
                    className="mgrtask-btn btn-file"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleViewFile(reviewingTask._id, reviewingTask.submissionFile.filename)}
                  >
                    <FiFile style={{ marginRight: 6 }} />
                    View / Download: {reviewingTask.submissionFile.filename}
                  </button>
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
                    Uploaded: {new Date(reviewingTask.submissionFile.uploadedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p style={{ color: '#aaa', fontSize: '13px', marginBottom: 12 }}>
                  No file attached.
                </p>
              )}
              <div className="mgr-form-group">
                <label>
                  Rejection Note{' '}
                  <span style={{ color: '#aaa', fontSize: 12 }}>(fill only if rejecting)</span>
                </label>
                <textarea
                  placeholder="Reason for rejection..."
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mgr-modal-footer">
              <button className="mgrtask-btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button
                className="mgrtask-btn btn-reject"
                onClick={() => handleReview('rejected')}
                disabled={reviewing}
              >
                <FiXCircle style={{ marginRight: 4 }} /> Reject
              </button>
              <button
                className="mgrtask-btn btn-approve"
                onClick={() => handleReview('approved')}
                disabled={reviewing}
              >
                <FiCheckCircle style={{ marginRight: 4 }} /> Approve & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          EDIT TASK MODAL
      ══════════════════════════════════════════════ */}
      {showEditModal && editingTask && (
        <div className="mgr-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="mgr-modal-box mgr-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3><FiEdit2 style={{ marginRight: 6 }} /> Edit Task</h3>
              <button className="mgr-modal-close" onClick={() => setShowEditModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleEdit} className="mgr-modal-body">

              {/* Title */}
              <div className="mgr-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="mgr-form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              {/* Project */}
              <div className="mgr-form-group">
                <label>Project</label>
                <select
                  value={editForm.project}
                  onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name || p.title}{p.status ? ` (${p.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Employee */}
              <div className="mgr-form-group">
                <label>Assign Employee *</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}{emp.department ? ` — ${emp.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="mgr-form-group">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="pending-approval">Pending Approval</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority + Deadline */}
              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="mgr-form-group">
                  <label>Deadline *</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mgr-modal-footer">
                <button
                  type="button"
                  className="mgrtask-btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgrtask-btn btn-primary"
                  disabled={editing}
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}