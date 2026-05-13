import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import {
  FiPlus, FiX, FiFile, FiCheckCircle, FiXCircle, FiZap,
  FiEdit2, FiTrash2
} from 'react-icons/fi';
import './ManagerTasks.css';

// ── GitHub validators ─────────────────────────────────────────
const isValidBranch = (v) => {
  if (!v || !String(v).trim()) return true;
  const b = String(v).trim();
  return /^[A-Za-z0-9._\-\/]+$/.test(b) && !b.includes("..") && !b.startsWith("/") && !b.endsWith("/");
};
const isValidIssueUrl = (v) => {
  if (!v || !String(v).trim()) return true;
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/issues\/\d+\/?(#.*)?$/.test(String(v).trim());
};
const openLink = (url) => {
  const u = String(url || '').trim();
  if (!u) return;
  window.open(u, '_blank', 'noopener,noreferrer');
};

const emptyRecurrence = {
  enabled: false,
  frequency: 'daily',
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: '',
  startDate: '',
  endDate: '',
};

const formatRecurrence = (rec) => {
  if (!rec?.enabled) return '—';
  if (rec.frequency === 'daily') return `Daily · every ${rec.interval || 1} day(s)`;
  if (rec.frequency === 'weekly') {
    const days = (rec.daysOfWeek || [])
      .map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d])
      .join(', ');
    return `Weekly · every ${rec.interval || 1} week(s) ${days ? `(${days})` : ''}`;
  }
  if (rec.frequency === 'monthly') {
    return `Monthly · day ${rec.dayOfMonth || 1} every ${rec.interval || 1} month(s)`;
  }
  return '—';
};

// ── Demo Task Templates ────────────────────────────────────────────────
const DEMO_TASKS = [
  { label: '🐛 Bug Fix', title: 'Fix critical bug in production', description: 'Identify and resolve the critical bug reported by the client. Test thoroughly before marking complete.', priority: 'high', status: 'pending' },
  { label: '🎨 UI Design', title: 'Design new dashboard UI', description: 'Create a clean and modern dashboard layout. Follow the existing design system and brand guidelines.', priority: 'medium', status: 'pending' },
  { label: '📄 Documentation', title: 'Write API documentation', description: 'Document all REST API endpoints with request/response examples using the standard format.', priority: 'low', status: 'pending' },
  { label: '🔍 Code Review', title: 'Review and test new feature branch', description: 'Review the pull request, run tests, check for edge cases, and provide detailed feedback.', priority: 'medium', status: 'pending' },
  { label: '🚀 Feature Development', title: 'Develop new user authentication module', description: 'Implement login, registration, password reset, and JWT token management for the new module.', priority: 'high', status: 'pending' },
  { label: '🧪 Testing', title: 'Write unit tests for core functions', description: 'Write comprehensive unit tests covering all edge cases. Aim for minimum 80% code coverage.', priority: 'medium', status: 'pending' },
  { label: '📊 Report', title: 'Prepare weekly performance report', description: 'Compile task completion stats, attendance summary, and key highlights for the weekly review meeting.', priority: 'medium', status: 'pending' },
  { label: '🔧 Setup', title: 'Configure deployment pipeline', description: 'Set up CI/CD pipeline for automated testing and deployment to staging and production environments.', priority: 'high', status: 'pending' },
];

export default function ManagerTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Create Task modal ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', project: '',
    priority: 'medium',
    deadline: '',
    status: 'pending',

    // ✅ GitHub fields for manager/admin
    githubBranch: '',
    githubIssueUrl: '',

    // ✅ New fields
    dependsOn: [],
    checklist: [],
    subtasks: [],
    recurrence: { ...emptyRecurrence },
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [aiTaskLoading, setAiTaskLoading] = useState(false);

  // Demo-only controls
  const [allowNoProject, setAllowNoProject] = useState(false);
  const [useNoProject, setUseNoProject] = useState(false);

  // ── Assign Employee modal ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTask, setAssigningTask] = useState(null);
  const [assignEmpId, setAssignEmpId] = useState('');

  // ── Review Submission modal ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // ── Edit Task modal ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', project: '',
    priority: 'medium',
    deadline: '',
    status: 'pending',

    // ✅ GitHub fields
    githubBranch: '',
    githubIssueUrl: '',

    // ✅ New fields
    dependsOn: [],
    checklist: [],
    subtasks: [],
    recurrence: { ...emptyRecurrence },
  });
  const [editing, setEditing] = useState(false);

  // ── Filter ──
  const [filter, setFilter] = useState({ status: '', priority: '', project: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [taskRes, projRes, teamRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/projects'),
        API.get('/users/my-team'),
      ]);
      const tasks = taskRes.data?.data ?? taskRes.data;
      const projects = projRes.data?.data ?? projRes.data;
      const team = teamRes.data?.data ?? teamRes.data;
      setTasks(Array.isArray(tasks) ? tasks : []);
      setProjects(Array.isArray(projects) ? projects : []);
      setEmployees(Array.isArray(team) ? team : []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', project: '',
      priority: 'medium',
      deadline: '',
      status: 'pending',
      githubBranch: '',
      githubIssueUrl: '',
      dependsOn: [],
      checklist: [],
      subtasks: [],
      recurrence: { ...emptyRecurrence },
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

  const applyDemo = (demo) => {
    setForm((prev) => ({
      ...prev,
      title: demo.title,
      description: demo.description,
      priority: demo.priority,
      status: demo.status,
      project: '',
    }));
    setAllowNoProject(true);
    setUseNoProject(true);
    setShowDemoMenu(false);
    toast.info(`Template applied: ${demo.label}`);
  };

  const updateChecklist = (setter, index, value) => {
    setter((prev) => {
      const next = [...prev.checklist];
      next[index] = { ...next[index], text: value };
      return { ...prev, checklist: next };
    });
  };

  const addChecklistItem = (setter) => {
    setter((prev) => ({ ...prev, checklist: [...prev.checklist, { text: '', done: false }] }));
  };

  const removeChecklistItem = (setter, index) => {
    setter((prev) => {
      const next = [...prev.checklist];
      next.splice(index, 1);
      return { ...prev, checklist: next };
    });
  };

  const updateSubtask = (setter, index, field, value) => {
    setter((prev) => {
      const next = [...prev.subtasks];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, subtasks: next };
    });
  };

  const addSubtask = (setter) => {
    setter((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { title: '', description: '', assignedTo: '', status: 'pending', dueDate: '' },
      ],
    }));
  };

  const removeSubtask = (setter, index) => {
    setter((prev) => {
      const next = [...prev.subtasks];
      next.splice(index, 1);
      return { ...prev, subtasks: next };
    });
  };

  // ── Create Task ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required');
    if (!useNoProject && !form.project) return toast.error('Please select a project');
    if (!selectedEmployee) return toast.error('Please assign an employee');
    if (!form.deadline) return toast.error('Please set a deadline');

    if (!isValidBranch(form.githubBranch)) return toast.error('Invalid GitHub branch');
    if (!isValidIssueUrl(form.githubIssueUrl)) return toast.error('Invalid GitHub issue URL');

    setCreating(true);
    try {
      const cleanedChecklist = form.checklist.filter((c) => String(c.text || '').trim());
      const cleanedSubtasks = form.subtasks.filter((s) => String(s.title || '').trim());

      await API.post('/tasks', {
        title: form.title,
        description: form.description,
        project: useNoProject ? null : form.project,
        assignedTo: selectedEmployee,
        assignedEmployees: [selectedEmployee],
        priority: form.priority,
        dueDate: form.deadline,
        deadline: form.deadline,
        status: form.status,

        // ✅ GitHub (manager/admin)
        githubBranch: form.githubBranch,
        githubIssueUrl: form.githubIssueUrl,

        // ✅ New fields
        dependsOn: form.dependsOn,
        checklist: cleanedChecklist,
        subtasks: cleanedSubtasks,
        recurrence: form.recurrence,
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

  // ── Assign Employee ──
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
        assignedTo: assignEmpId,
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
      toast.success(decision === 'approved' ? '✅ Task approved & completed!' : '❌ Submission rejected.');
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
      toast.error('Failed to fetch file.');
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
      deadline: task.deadline ? task.deadline.slice(0, 10) : task.dueDate ? task.dueDate.slice(0, 10) : '',
      status: task.status || 'pending',

      githubBranch: task.githubBranch || '',
      githubIssueUrl: task.githubIssueUrl || '',

      dependsOn: (task.dependsOn || []).map((d) => (typeof d === 'object' ? d._id : d)),
      checklist: (task.checklist || []).map((c) => ({ _id: c._id, text: c.text, done: !!c.done })),
      subtasks: (task.subtasks || []).map((s) => ({
        _id: s._id,
        title: s.title,
        description: s.description || '',
        assignedTo: s.assignedTo?._id || s.assignedTo || '',
        status: s.status || 'pending',
        dueDate: s.dueDate ? s.dueDate.slice(0, 10) : '',
      })),
      recurrence: task.recurrence?.enabled
        ? {
            enabled: true,
            frequency: task.recurrence.frequency || 'daily',
            interval: task.recurrence.interval || 1,
            daysOfWeek: task.recurrence.daysOfWeek || [],
            dayOfMonth: task.recurrence.dayOfMonth || '',
            startDate: task.recurrence.startDate ? task.recurrence.startDate.slice(0, 10) : '',
            endDate: task.recurrence.endDate ? task.recurrence.endDate.slice(0, 10) : '',
          }
        : { ...emptyRecurrence },
    });
    const cur = task.assignedEmployees?.[0] ?? task.assignedTo;
    setSelectedEmployee(typeof cur === 'object' ? cur?._id ?? '' : cur ?? '');
    setShowEditModal(true);
  };

  // ✅ FIXED: do not send project unless changed
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return toast.error('Task title is required');
    if (!selectedEmployee) return toast.error('Please assign an employee');
    if (!editForm.deadline) return toast.error('Please set a deadline');

    if (!isValidBranch(editForm.githubBranch)) return toast.error('Invalid GitHub branch');
    if (!isValidIssueUrl(editForm.githubIssueUrl)) return toast.error('Invalid GitHub issue URL');

    setEditing(true);
    try {
      const originalProjectId = editingTask?.project?._id || '';
      const newProjectId = editForm.project || '';

      const payload = {
        title: editForm.title,
        description: editForm.description,
        assignedTo: selectedEmployee,
        assignedEmployees: [selectedEmployee],
        priority: editForm.priority,
        dueDate: editForm.deadline,
        deadline: editForm.deadline,
        status: editForm.status,

        githubBranch: editForm.githubBranch,
        githubIssueUrl: editForm.githubIssueUrl,

        dependsOn: editForm.dependsOn,
        checklist: editForm.checklist.filter((c) => String(c.text || '').trim()),
        subtasks: editForm.subtasks.filter((s) => String(s.title || '').trim()),
        recurrence: editForm.recurrence,
      };

      // include project ONLY if user changed it
      if (newProjectId !== originalProjectId) {
        payload.project = newProjectId || null;
      }

      await API.put(`/tasks/${editingTask._id}`, payload);

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
      return task.assignedEmployees.map((e) => (typeof e === 'object' ? e.name : e)).filter(Boolean).join(', ');
    }
    if (task.assignedTo) return typeof task.assignedTo === 'object' ? task.assignedTo.name || '' : task.assignedTo;
    return '';
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.project && t.project?._id !== filter.project) return false;
    return true;
  });

  if (loading) return <div className="mgrtasks-loading">Loading tasks...</div>;

  return (
    <div className="mgrtasks-container">
      <div className="mgrtasks-header">
        <h2 className="mgrtasks-title">Manage Tasks</h2>
        <button className="mgrtask-btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          <FiPlus style={{ marginRight: 6 }} /> Create Task
        </button>
      </div>

      {employees.length === 0 && (
        <div className="mgrtasks-warning">
          ⚠️ No team members found. Ask the Admin to assign employees to your team first.
        </div>
      )}

      <div className="mgrtasks-filters">
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="pending-approval">Pending Approval</option>
          <option value="completed">Completed</option>
        </select>

        <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select value={filter.project} onChange={(e) => setFilter({ ...filter, project: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name || p.title}</option>
          ))}
        </select>

        {(filter.status || filter.priority || filter.project) && (
          <button className="mgrtask-btn btn-secondary" onClick={() => setFilter({ status: '', priority: '', project: '' })}>
            Clear Filters
          </button>
        )}
      </div>

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
              <th>Dependencies</th>
              <th>Subtasks</th>
              <th>Checklist</th>
              <th>Recurring</th>
              <th>GitHub</th>
              <th>Submission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const empNames = getEmpNames(t);
              const isCompleted = t.status === 'completed';
              const deadline = t.deadline || t.dueDate;

              const blockedBy = (t.dependsOn || []).filter((d) => d.status !== 'completed');
              const blocking = t.blocking || [];
              const depSummary = blockedBy.length || blocking.length
                ? `Blocked by ${blockedBy.length} • Blocking ${blocking.length}`
                : '—';

              const subtasksTotal = t.subtasks?.length || 0;
              const subtasksDone = t.subtasks?.filter((s) => s.status === 'completed').length || 0;

              const checklistTotal = t.checklist?.length || 0;
              const checklistDone = t.checklist?.filter((c) => c.done).length || 0;

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
                    {deadline ? new Date(deadline).toLocaleDateString() : '—'}
                  </td>
                  <td title={depSummary}>{depSummary}</td>
                  <td>{subtasksTotal ? `${subtasksDone}/${subtasksTotal}` : '—'}</td>
                  <td>{checklistTotal ? `${checklistDone}/${checklistTotal}` : '—'}</td>
                  <td>{formatRecurrence(t.recurrence)}</td>

                  {/* ✅ GitHub buttons */}
                  <td>
                    <div className="mgr-gh-actions">
                      {t.project?.githubRepoUrl ? (
                        <button className="mgrtask-btn btn-gh" onClick={() => openLink(t.project.githubRepoUrl)}>
                          View Repository
                        </button>
                      ) : null}
                      {t.githubIssueUrl ? (
                        <button className="mgrtask-btn btn-gh" onClick={() => openLink(t.githubIssueUrl)}>
                          View Issue
                        </button>
                      ) : null}
                      {t.githubCommitUrl ? (
                        <button className="mgrtask-btn btn-gh" onClick={() => openLink(t.githubCommitUrl)}>
                          View Commit
                        </button>
                      ) : null}
                      {t.githubPullRequestUrl ? (
                        <button className="mgrtask-btn btn-gh" onClick={() => openLink(t.githubPullRequestUrl)}>
                          View Pull Request
                        </button>
                      ) : null}
                      {!t.project?.githubRepoUrl && !t.githubIssueUrl && !t.githubCommitUrl && !t.githubPullRequestUrl ? (
                        <span style={{ color: '#aaa', fontSize: 13 }}>—</span>
                      ) : null}
                    </div>
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
                        <button className="mgrtask-btn btn-secondary" onClick={() => openAssignModal(t)}>
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
                        <button className="mgrtask-btn btn-review" onClick={() => openReviewModal(t)}>
                          Review
                        </button>
                      )}
                      {isCompleted && <span className="mgr-done">✅ Done</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', color: '#aaa', padding: '32px' }}>
                  {tasks.length === 0 ? 'No tasks yet. Click "Create Task" to add one.' : 'No tasks match the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="mgr-modal-overlay" onClick={() => { setShowCreateModal(false); resetForm(); }}>
          <div className="mgr-modal-box mgr-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3><FiPlus style={{ marginRight: 6 }} /> Create Task</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <button type="button" className="mgrtask-btn btn-demo" onClick={() => setShowDemoMenu((v) => !v)}>
                    <FiZap style={{ marginRight: 5 }} /> Demo Task
                  </button>
                  {showDemoMenu && (
                    <div className="demo-dropdown">
                      <p className="demo-dropdown-title">Choose a template:</p>
                      {DEMO_TASKS.map((demo, idx) => (
                        <button key={idx} type="button" className="demo-dropdown-item" onClick={() => applyDemo(demo)}>
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="mgr-modal-close" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <FiX />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="mgr-modal-body">
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

              {/* ✅ Dependencies */}
              <div className="mgr-form-group">
                <label>Blocked By (Dependencies)</label>
                <select
                  multiple
                  value={form.dependsOn}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setForm({ ...form, dependsOn: values });
                  }}
                >
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </select>
                <small className="mgr-hint">Hold Ctrl/Cmd to select multiple tasks.</small>
              </div>

              {/* ✅ Checklist */}
              <div className="mgr-form-group">
                <label>Checklist</label>
                {form.checklist.map((item, idx) => (
                  <div key={idx} className="mgr-inline-row">
                    <input
                      type="text"
                      placeholder="Checklist item..."
                      value={item.text}
                      onChange={(e) => updateChecklist(setForm, idx, e.target.value)}
                    />
                    <button type="button" className="mgrtask-btn btn-danger" onClick={() => removeChecklistItem(setForm, idx)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="mgrtask-btn btn-secondary" onClick={() => addChecklistItem(setForm)}>
                  + Add Checklist Item
                </button>
              </div>

              {/* ✅ Subtasks */}
              <div className="mgr-form-group">
                <label>Subtasks</label>
                {form.subtasks.map((sub, idx) => (
                  <div key={idx} className="mgr-subtask-card">
                    <div className="mgr-form-row">
                      <div className="mgr-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          placeholder="Subtask title..."
                          value={sub.title}
                          onChange={(e) => updateSubtask(setForm, idx, 'title', e.target.value)}
                        />
                      </div>
                      <div className="mgr-form-group">
                        <label>Status</label>
                        <select
                          value={sub.status}
                          onChange={(e) => updateSubtask(setForm, idx, 'status', e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="mgr-form-row">
                      <div className="mgr-form-group">
                        <label>Assigned To</label>
                        <select
                          value={sub.assignedTo}
                          onChange={(e) => updateSubtask(setForm, idx, 'assignedTo', e.target.value)}
                        >
                          <option value="">-- Optional --</option>
                          {employees.map((emp) => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mgr-form-group">
                        <label>Due Date</label>
                        <input
                          type="date"
                          value={sub.dueDate || ''}
                          onChange={(e) => updateSubtask(setForm, idx, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mgr-form-group">
                      <label>Description</label>
                      <textarea
                        rows={2}
                        value={sub.description}
                        onChange={(e) => updateSubtask(setForm, idx, 'description', e.target.value)}
                      />
                    </div>
                    <button type="button" className="mgrtask-btn btn-danger" onClick={() => removeSubtask(setForm, idx)}>
                      Remove Subtask
                    </button>
                  </div>
                ))}
                <button type="button" className="mgrtask-btn btn-secondary" onClick={() => addSubtask(setForm)}>
                  + Add Subtask
                </button>
              </div>

              {/* ✅ Recurrence */}
              <div className="mgr-form-group">
                <label>Recurring Task</label>
                <label className="mgr-toggle">
                  <input
                    type="checkbox"
                    checked={form.recurrence.enabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurrence: { ...form.recurrence, enabled: e.target.checked },
                      })
                    }
                  />
                  Enable recurrence
                </label>

                {form.recurrence.enabled && (
                  <div className="mgr-recurring-grid">
                    <div className="mgr-form-group">
                      <label>Frequency</label>
                      <select
                        value={form.recurrence.frequency}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recurrence: { ...form.recurrence, frequency: e.target.value },
                          })
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="mgr-form-group">
                      <label>Interval</label>
                      <input
                        type="number"
                        min="1"
                        value={form.recurrence.interval}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recurrence: { ...form.recurrence, interval: e.target.value },
                          })
                        }
                      />
                    </div>

                    {form.recurrence.frequency === 'weekly' && (
                      <div className="mgr-form-group">
                        <label>Days of Week</label>
                        <div className="mgr-weekdays">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => (
                            <label key={d} className="mgr-weekday">
                              <input
                                type="checkbox"
                                checked={form.recurrence.daysOfWeek.includes(idx)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...form.recurrence.daysOfWeek, idx]
                                    : form.recurrence.daysOfWeek.filter((v) => v !== idx);
                                  setForm({
                                    ...form,
                                    recurrence: { ...form.recurrence, daysOfWeek: next },
                                  });
                                }}
                              />
                              {d}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {form.recurrence.frequency === 'monthly' && (
                      <div className="mgr-form-group">
                        <label>Day of Month</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={form.recurrence.dayOfMonth}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              recurrence: { ...form.recurrence, dayOfMonth: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="mgr-form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={form.recurrence.startDate}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recurrence: { ...form.recurrence, startDate: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="mgr-form-group">
                      <label>End Date (Optional)</label>
                      <input
                        type="date"
                        value={form.recurrence.endDate}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recurrence: { ...form.recurrence, endDate: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ GitHub branch + issue */}
              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>GitHub Branch</label>
                  <input
                    type="text"
                    placeholder="feature/my-branch"
                    value={form.githubBranch}
                    onChange={(e) => setForm({ ...form, githubBranch: e.target.value })}
                  />
                </div>
                <div className="mgr-form-group">
                  <label>GitHub Issue URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/owner/repo/issues/123"
                    value={form.githubIssueUrl}
                    onChange={(e) => setForm({ ...form, githubIssueUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="mgr-form-group">
                <label>
                  Initial Status <span style={{ color: '#888', fontSize: '12px' }}>(you cannot change this later)</span>
                </label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                </select>
              </div>

              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
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
                <button type="button" className="mgrtask-btn btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="mgrtask-btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
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
                  <select value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)}>
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
              <button className="mgrtask-btn btn-primary" onClick={handleAssign} disabled={!assignEmpId || employees.length === 0}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
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

              {/* ✅ GitHub links for review */}
              <div className="mgr-gh-actions" style={{ marginBottom: 12 }}>
                {reviewingTask.project?.githubRepoUrl ? (
                  <button className="mgrtask-btn btn-gh" onClick={() => openLink(reviewingTask.project.githubRepoUrl)}>
                    View Repository
                  </button>
                ) : null}
                {reviewingTask.githubIssueUrl ? (
                  <button className="mgrtask-btn btn-gh" onClick={() => openLink(reviewingTask.githubIssueUrl)}>
                    View Issue
                  </button>
                ) : null}
                {reviewingTask.githubCommitUrl ? (
                  <button className="mgrtask-btn btn-gh" onClick={() => openLink(reviewingTask.githubCommitUrl)}>
                    View Commit
                  </button>
                ) : null}
                {reviewingTask.githubPullRequestUrl ? (
                  <button className="mgrtask-btn btn-gh" onClick={() => openLink(reviewingTask.githubPullRequestUrl)}>
                    View Pull Request
                  </button>
                ) : null}
              </div>

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
                  Rejection Note <span style={{ color: '#aaa', fontSize: 12 }}>(fill only if rejecting)</span>
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
              <button className="mgrtask-btn btn-reject" onClick={() => handleReview('rejected')} disabled={reviewing}>
                <FiXCircle style={{ marginRight: 4 }} /> Reject
              </button>
              <button className="mgrtask-btn btn-approve" onClick={() => handleReview('approved')} disabled={reviewing}>
                <FiCheckCircle style={{ marginRight: 4 }} /> Approve & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
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
              <div className="mgr-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="mgr-form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="mgr-form-group">
                <label>Project</label>
                <select value={editForm.project} onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}>
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name || p.title}{p.status ? ` (${p.status})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mgr-form-group">
                <label>Assign Employee *</label>
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} required>
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}{emp.department ? ` — ${emp.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Dependencies */}
              <div className="mgr-form-group">
                <label>Blocked By (Dependencies)</label>
                <select
                  multiple
                  value={editForm.dependsOn}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setEditForm({ ...editForm, dependsOn: values });
                  }}
                >
                  {tasks
                    .filter((t) => t._id !== editingTask._id)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title} ({t.status})
                      </option>
                    ))}
                </select>
                <small className="mgr-hint">Hold Ctrl/Cmd to select multiple tasks.</small>
              </div>

              {/* ✅ Checklist */}
              <div className="mgr-form-group">
                <label>Checklist</label>
                {editForm.checklist.map((item, idx) => (
                  <div key={idx} className="mgr-inline-row">
                    <input
                      type="text"
                      placeholder="Checklist item..."
                      value={item.text}
                      onChange={(e) => updateChecklist(setEditForm, idx, e.target.value)}
                    />
                    <button type="button" className="mgrtask-btn btn-danger" onClick={() => removeChecklistItem(setEditForm, idx)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" className="mgrtask-btn btn-secondary" onClick={() => addChecklistItem(setEditForm)}>
                  + Add Checklist Item
                </button>
              </div>

              {/* ✅ Subtasks */}
              <div className="mgr-form-group">
                <label>Subtasks</label>
                {editForm.subtasks.map((sub, idx) => (
                  <div key={idx} className="mgr-subtask-card">
                    <div className="mgr-form-row">
                      <div className="mgr-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          placeholder="Subtask title..."
                          value={sub.title}
                          onChange={(e) => updateSubtask(setEditForm, idx, 'title', e.target.value)}
                        />
                      </div>
                      <div className="mgr-form-group">
                        <label>Status</label>
                        <select
                          value={sub.status}
                          onChange={(e) => updateSubtask(setEditForm, idx, 'status', e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="mgr-form-row">
                      <div className="mgr-form-group">
                        <label>Assigned To</label>
                        <select
                          value={sub.assignedTo}
                          onChange={(e) => updateSubtask(setEditForm, idx, 'assignedTo', e.target.value)}
                        >
                          <option value="">-- Optional --</option>
                          {employees.map((emp) => (
                            <option key={emp._id} value={emp._id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mgr-form-group">
                        <label>Due Date</label>
                        <input
                          type="date"
                          value={sub.dueDate || ''}
                          onChange={(e) => updateSubtask(setEditForm, idx, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mgr-form-group">
                      <label>Description</label>
                      <textarea
                        rows={2}
                        value={sub.description}
                        onChange={(e) => updateSubtask(setEditForm, idx, 'description', e.target.value)}
                      />
                    </div>
                    <button type="button" className="mgrtask-btn btn-danger" onClick={() => removeSubtask(setEditForm, idx)}>
                      Remove Subtask
                    </button>
                  </div>
                ))}
                <button type="button" className="mgrtask-btn btn-secondary" onClick={() => addSubtask(setEditForm)}>
                  + Add Subtask
                </button>
              </div>

              {/* ✅ Recurrence */}
              <div className="mgr-form-group">
                <label>Recurring Task</label>
                <label className="mgr-toggle">
                  <input
                    type="checkbox"
                    checked={editForm.recurrence.enabled}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        recurrence: { ...editForm.recurrence, enabled: e.target.checked },
                      })
                    }
                  />
                  Enable recurrence
                </label>

                {editForm.recurrence.enabled && (
                  <div className="mgr-recurring-grid">
                    <div className="mgr-form-group">
                      <label>Frequency</label>
                      <select
                        value={editForm.recurrence.frequency}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recurrence: { ...editForm.recurrence, frequency: e.target.value },
                          })
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="mgr-form-group">
                      <label>Interval</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.recurrence.interval}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recurrence: { ...editForm.recurrence, interval: e.target.value },
                          })
                        }
                      />
                    </div>

                    {editForm.recurrence.frequency === 'weekly' && (
                      <div className="mgr-form-group">
                        <label>Days of Week</label>
                        <div className="mgr-weekdays">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => (
                            <label key={d} className="mgr-weekday">
                              <input
                                type="checkbox"
                                checked={editForm.recurrence.daysOfWeek.includes(idx)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...editForm.recurrence.daysOfWeek, idx]
                                    : editForm.recurrence.daysOfWeek.filter((v) => v !== idx);
                                  setEditForm({
                                    ...editForm,
                                    recurrence: { ...editForm.recurrence, daysOfWeek: next },
                                  });
                                }}
                              />
                              {d}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {editForm.recurrence.frequency === 'monthly' && (
                      <div className="mgr-form-group">
                        <label>Day of Month</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editForm.recurrence.dayOfMonth}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              recurrence: { ...editForm.recurrence, dayOfMonth: e.target.value },
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="mgr-form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={editForm.recurrence.startDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recurrence: { ...editForm.recurrence, startDate: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="mgr-form-group">
                      <label>End Date (Optional)</label>
                      <input
                        type="date"
                        value={editForm.recurrence.endDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recurrence: { ...editForm.recurrence, endDate: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ GitHub branch + issue */}
              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>GitHub Branch</label>
                  <input
                    type="text"
                    placeholder="feature/my-branch"
                    value={editForm.githubBranch}
                    onChange={(e) => setEditForm({ ...editForm, githubBranch: e.target.value })}
                  />
                </div>
                <div className="mgr-form-group">
                  <label>GitHub Issue URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/owner/repo/issues/123"
                    value={editForm.githubIssueUrl}
                    onChange={(e) => setEditForm({ ...editForm, githubIssueUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="mgr-form-group">
                <label>Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="pending-approval">Pending Approval</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>Priority</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
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
                <button type="button" className="mgrtask-btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mgrtask-btn btn-primary" disabled={editing}>
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