import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import '../../pages/Admin/ProjectManagement.css';

const ManagerProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (err) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const columns = [
    { header: 'Project Name', accessor: 'name' },
    { header: 'Description', render: (row) => row.description?.substring(0, 50) || 'No description' },
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
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '18px', color: '#888', marginBottom: '8px' }}>No projects assigned yet</p>
          <p style={{ fontSize: '14px', color: '#aaa' }}>Admin will assign projects to you. Check back later.</p>
        </div>
      ) : (
        <DataTable title={`Assigned Projects (${projects.length})`} columns={columns} data={projects} />
      )}
    </div>
  );
};

export default ManagerProjects;