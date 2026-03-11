import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import './ProjectManagement.css';
import './UserManagement.css';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', status: 'Not Started', priority: 'Medium',
    startDate: '', endDate: '', manager: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchManagers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (err) {
      toast.error('Failed to fetch projects');
    }
  };

  const fetchManagers = async () => {
    try {
      const { data } = await API.get('/users?role=manager');
      setManagers(data);
    } catch (err) {
      console.error('Failed to fetch managers');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreate = () => {
    setEditingProject(null);
    setForm({
      name: '', description: '', status: 'Not Started', priority: 'Medium',
      startDate: '', endDate: '', manager: '',
    });
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      manager: project.manager?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, form);
        toast.success('Project updated successfully');
      } else {
        await API.post('/projects', form);
        toast.success('Project created and assigned to manager');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await API.delete(`/projects/${id}`);
      toast.success('Project deleted');
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const columns = [
    { header: 'Project Name', accessor: 'name' },
    {
      header: 'Manager',
      render: (row) => (
        <span className="manager-badge">
          {row.manager?.name || 'Not Assigned'}
        </span>
      ),
    },
    { header: 'Priority', render: (row) => <span className={`priority-badge ${row.priority?.toLowerCase()}`}>{row.priority}</span> },
    { header: 'Status', render: (row) => <span className={`status-badge ${row.status?.toLowerCase().replace(/ /g, '-')}`}>{row.status}</span> },
    {
      header: 'Progress',
      render: (row) => (
        <div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${row.progress || 0}%` }} />
          </div>
          <span className="progress-text">{row.progress || 0}%</span>
        </div>
      ),
    },
    { header: 'Team', render: (row) => `${row.team?.length || 0} members` },
    { header: 'Start', render: (row) => formatDate(row.startDate) },
    { header: 'Deadline', render: (row) => formatDate(row.endDate) },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Project Management</h2>
        <button className="add-btn" onClick={openCreate}><FiPlus /> Create Project</button>
      </div>

      <DataTable
        title={`All Projects (${projects.length})`}
        columns={columns}
        data={projects}
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
            <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Project name" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Project description" />
              </div>
              <div className="form-group">
                <label>Assign Manager *</label>
                <select name="manager" value={form.manager} onChange={handleChange} required>
                  <option value="">-- Select a Manager --</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.department || 'No Dept'}) — {m.teamMembers?.length || 0} team members
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">{editingProject ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;