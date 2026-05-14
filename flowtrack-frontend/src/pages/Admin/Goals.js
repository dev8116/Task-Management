import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import DataTable from '../../components/Common/DataTable';
import './Goals.css';

const emptyGoal = {
  title: '',
  description: '',
  owner: '',
  team: '',
  project: '',
  tasks: [],
  status: 'Not Started',
  startDate: '',
  endDate: '',
  keyResults: [],
};

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  if (Array.isArray(payload?.data?.tasks)) return payload.data.tasks;
  if (Array.isArray(payload?.projects)) return payload.projects;
  if (Array.isArray(payload?.users)) return payload.users;
  return [];
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyGoal);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [goalRes, userRes, projectRes, taskRes] = await Promise.all([
        API.get('/goals'),
        API.get('/users'),
        API.get('/projects'),
        API.get('/tasks'),
      ]);

      setGoals(toArray(goalRes.data));
      setUsers(toArray(userRes.data));
      setProjects(toArray(projectRes.data));
      setTasks(toArray(taskRes.data));
    } catch (err) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (key, val) => setForm({ ...form, [key]: val });

  const addKeyResult = () => {
    setForm({
      ...form,
      keyResults: [
        ...form.keyResults,
        { title: '', targetValue: 0, currentValue: 0, unit: '' },
      ],
    });
  };

  const updateKeyResult = (idx, key, value) => {
    const updated = [...form.keyResults];
    updated[idx] = { ...updated[idx], [key]: value };
    setForm({ ...form, keyResults: updated });
  };

  const removeKeyResult = (idx) => {
    const updated = form.keyResults.filter((_, i) => i !== idx);
    setForm({ ...form, keyResults: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.title || !form.owner) {
        toast.error('Title and Owner are required');
        return;
      }
      if (editingId) {
        await API.put(`/goals/${editingId}`, form);
        toast.success('Goal updated');
      } else {
        await API.post('/goals', form);
        toast.success('Goal created');
      }
      setForm(emptyGoal);
      setEditingId(null);
      fetchAll();
    } catch {
      toast.error('Failed to save goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingId(goal._id);
    setForm({
      title: goal.title || '',
      description: goal.description || '',
      owner: goal.owner?._id || '',
      team: goal.team || '',
      project: goal.project?._id || '',
      tasks: (goal.tasks || []).map((t) => t._id || t),
      status: goal.status || 'Not Started',
      startDate: goal.startDate ? goal.startDate.split('T')[0] : '',
      endDate: goal.endDate ? goal.endDate.split('T')[0] : '',
      keyResults: goal.keyResults || [],
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await API.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    {
      header: 'Goal',
      render: (row) => (
        <div>
          <strong>{row.title}</strong>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {row.description || '—'}
          </div>
        </div>
      ),
    },
    {
      header: 'Owner',
      render: (row) => <span>{row.owner?.name || '—'}</span>,
    },
    {
      header: 'Project',
      render: (row) => <span>{row.project?.name || '—'}</span>,
    },
    {
      header: 'Progress',
      render: (row) => (
        <div className="goal-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${row.progress || 0}%` }}
            />
          </div>
          <span>{row.progress || 0}%</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`goal-status ${row.status?.toLowerCase().replace(/ /g, '-')}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="goal-actions">
          <button className="btn-link" onClick={() => handleEdit(row)}>Edit</button>
          <button className="btn-link danger" onClick={() => handleDelete(row._id)}>Delete</button>
        </div>
      ),
    },
  ];

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <div className="goals-page">
      <h2>Goals & OKRs</h2>

      <form className="goal-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div>
            <label>Title *</label>
            <input value={form.title} onChange={(e) => onChange('title', e.target.value)} />
          </div>
          <div>
            <label>Owner *</label>
            <select value={form.owner} onChange={(e) => onChange('owner', e.target.value)}>
              <option value="">Select owner</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label>Team (Manager)</label>
            <select value={form.team} onChange={(e) => onChange('team', e.target.value)}>
              <option value="">Select manager</option>
              {users.filter((u) => u.role === 'manager').map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Project</label>
            <select value={form.project} onChange={(e) => onChange('project', e.target.value)}>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => onChange('status', e.target.value)}>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>On Hold</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => onChange('startDate', e.target.value)} />
          </div>
          <div>
            <label>End Date</label>
            <input type="date" value={form.endDate} onChange={(e) => onChange('endDate', e.target.value)} />
          </div>
        </div>

        <div>
          <label>Tasks (linked)</label>
          <select
            multiple
            value={form.tasks}
            onChange={(e) =>
              onChange('tasks', Array.from(e.target.selectedOptions, (o) => o.value))
            }
          >
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
          <small className="hint">Hold Ctrl/Command to select multiple</small>
        </div>

        <div className="kr-section">
          <div className="kr-header">
            <h3>Key Results</h3>
            <button type="button" className="btn-primary" onClick={addKeyResult}>+ Add KR</button>
          </div>

          {form.keyResults.map((kr, idx) => (
            <div key={idx} className="kr-row">
              <input
                placeholder="KR title"
                value={kr.title}
                onChange={(e) => updateKeyResult(idx, 'title', e.target.value)}
              />
              <input
                type="number"
                placeholder="Target"
                value={kr.targetValue}
                onChange={(e) => updateKeyResult(idx, 'targetValue', Number(e.target.value))}
              />
              <input
                type="number"
                placeholder="Current"
                value={kr.currentValue}
                onChange={(e) => updateKeyResult(idx, 'currentValue', Number(e.target.value))}
              />
              <input
                placeholder="Unit"
                value={kr.unit}
                onChange={(e) => updateKeyResult(idx, 'unit', e.target.value)}
              />
              <button type="button" className="btn-link danger" onClick={() => removeKeyResult(idx)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-primary" type="submit">
            {editingId ? 'Update Goal' : 'Create Goal'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setForm(emptyGoal); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="goal-list">
        <h3>All Goals</h3>
        <DataTable title="" columns={columns} data={goals} searchable />
      </div>
    </div>
  );
};

export default Goals;