import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import TaskCard from '../../components/Common/TaskCard';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import '../../pages/Admin/UserManagement.css';
import './ManagerTasks.css';

const ManagerTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', project: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', project: '', assignedTo: '', priority: 'Medium', deadline: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [taskRes, projRes, teamRes] = await Promise.all([
        API.get('/tasks'),
        API.get('/projects'),
        API.get('/users/my-team'),
      ]);
      setTasks(taskRes.data);
      setProjects(projRes.data);
      setTeamMembers(teamRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/tasks', form);
      toast.success('Task created and assigned to employee');
      setShowModal(false);
      setForm({ title: '', description: '', project: '', assignedTo: '', priority: 'Medium', deadline: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      toast.success('Task updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.project && t.project?._id !== filter.project) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h2>Task Management</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}><FiPlus /> Create Task</button>
      </div>

      {/* Info Banner */}
      {teamMembers.length === 0 && (
        <div style={{
          background: '#fff3e0', border: '1px solid #ffcc02', borderRadius: '10px',
          padding: '16px', marginBottom: '20px', fontSize: '14px', color: '#ef6c00',
        }}>
          ⚠️ You don't have any team members yet. Ask the Admin to assign employees to your team before creating tasks.
        </div>
      )}

      <div className="filter-bar">
        <select value={filter.project} onChange={(e) => setFilter({ ...filter, project: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <span style={{ fontSize: '13px', color: '#888' }}>{filteredTasks.length} tasks</span>
      </div>

      <div className="task-grid">
        {filteredTasks.map((task) => (
          <div key={task._id}>
            <TaskCard task={task} onStatusChange={handleStatusChange} />
            <div className="task-assigned-to">
              👤 {task.assignedTo?.name || 'Unassigned'} • {task.project?.name || 'No Project'}
            </div>
            <button
              className="action-btn delete"
              style={{ marginTop: '4px', fontSize: '11px' }}
              onClick={() => handleDelete(task._id)}
            >
              Delete Task
            </button>
          </div>
        ))}
        {filteredTasks.length === 0 && <p style={{ color: '#888' }}>No tasks found. Create one to get started.</p>}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Task Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Task title" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Task description" />
              </div>
              <div className="form-group">
                <label>Project *</label>
                <select name="project" value={form.project} onChange={handleChange} required>
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assign to Team Member *</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleChange} required>
                  <option value="">-- Select Employee from Your Team --</option>
                  {teamMembers.map((e) => (
                    <option key={e._id} value={e._id}>{e.name} ({e.department || 'No Dept'})</option>
                  ))}
                </select>
                {teamMembers.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#c62828', marginTop: '4px' }}>
                    No team members available. Contact Admin to assign employees to you.
                  </p>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Deadline *</label>
                  <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={teamMembers.length === 0}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTasks;