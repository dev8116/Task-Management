import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import '../../pages/Admin/ProjectManagement.css';

const STATUS_OPTIONS = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Closed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const ManagerProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    status: 'Planning',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      name: project.name,
      description: project.description || '',
      priority: project.priority || 'Medium',
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      status: project.status || 'Planning',
    });
    setEditModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;

    if (editing.status === 'Planning' && ['Closed', 'Cancelled'].includes(form.status)) {
      toast.error('Only admin can close/cancel a Planning project.');
      return;
    }

    try {
      await API.put(`/projects/${editing._id}`, {
        name: form.name,
        description: form.description,
        priority: form.priority,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      });
      toast.success('Project updated');
      setEditModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');

  const filteredStatusOptions =
    editing?.status === 'Planning'
      ? STATUS_OPTIONS.filter((s) => !['Closed', 'Cancelled'].includes(s))
      : STATUS_OPTIONS;

  const columns = [
    { header: 'Project Name', accessor: 'name' },
    { header: 'Description', render: (row) => row.description?.substring(0, 50) || 'No description' },
    {
      header: 'Priority',
      render: (row) => (
        <span className={`priority-badge ${row.priority?.toLowerCase()}`}>{row.priority}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status?.toLowerCase().replace(/ /g, '-')}`}>
          {row.status}
        </span>
      ),
    },
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
    { header: 'Team Size', render: (row) => `${row.team?.length || 0} members` },
    { header: 'Start', render: (row) => formatDate(row.startDate) },
    { header: 'Deadline', render: (row) => formatDate(row.endDate) },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>My Projects</h2>
        <span style={{ fontSize: '14px', color: '#888' }}>
          Projects assigned to you by Admin
        </span>
      </div>

      {projects.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <p style={{ fontSize: '18px', color: '#888', marginBottom: '8px' }}>No projects assigned yet</p>
          <p style={{ fontSize: '14px', color: '#aaa' }}>Admin will assign projects to you. Check back later.</p>
        </div>
      ) : (
        <DataTable
          title={`Assigned Projects (${projects.length})`}
          columns={columns}
          data={projects}
          actions={(row) => (
            <button className="action-btn edit" onClick={() => openEdit(row)}>
              Update Project
            </button>
          )}
        />
      )}

      {editModal && (
        <div className="ft-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="ft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3>Update Project</h3>
              <button className="ft-modal-close" onClick={() => setEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdate} className="ft-modal-form">
              <div className="ft-modal-body">
                <div className="form-group">
                  <label>Project Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Update description"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select name="priority" value={form.priority} onChange={handleChange}>
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleChange}>
                      {filteredStatusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {editing?.status === 'Planning' && (
                      <small style={{ color: '#c00' }}>
                        Only admin can move Planning → Closed/Cancelled.
                      </small>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Deadline</label>
                    <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="ft-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProjects;