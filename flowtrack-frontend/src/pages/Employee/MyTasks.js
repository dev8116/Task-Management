import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import TaskCard from '../../components/Common/TaskCard';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import '../Manager/ManagerTasks.css';
import './MyTasks.css';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [view, setView] = useState('card');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await API.get('/tasks');
      setTasks(data);
    } catch (err) {
      toast.error('Failed to fetch tasks');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      toast.success(`Task marked as ${status}`);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    return true;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const tableColumns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Project', render: (row) => row.project?.name || 'N/A' },
    { header: 'Assigned By', render: (row) => row.assignedBy?.name || 'N/A' },
    { header: 'Priority', render: (row) => <span className={`priority-badge ${row.priority?.toLowerCase()}`}>{row.priority}</span> },
    {
      header: 'Status',
      render: (row) => {
        const isOverdue = new Date(row.deadline) < new Date() && row.status !== 'Completed';
        return <span className={`status-badge ${isOverdue ? 'overdue' : row.status?.toLowerCase().replace(/ /g, '-')}`}>
          {isOverdue ? 'Overdue' : row.status}
        </span>;
      },
    },
    { header: 'Deadline', render: (row) => formatDate(row.deadline) },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Tasks ({tasks.length})</h2></div>

      <div className="view-toggle">
        <button className={view === 'card' ? 'active' : ''} onClick={() => setView('card')}>Card View</button>
        <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table View</button>
      </div>

      <div className="filter-bar">
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
        <span style={{ fontSize: '13px', color: '#888' }}>{filteredTasks.length} tasks found</span>
      </div>

      {filteredTasks.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '16px', color: '#888' }}>No tasks found</p>
          <p style={{ fontSize: '14px', color: '#aaa' }}>Your manager will assign tasks to you.</p>
        </div>
      ) : view === 'card' ? (
        <div className="task-grid">
          {filteredTasks.map((task) => (
            <div key={task._id}>
              <TaskCard task={task} onStatusChange={handleStatusChange} />
              <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                📁 {task.project?.name || 'N/A'} • 👤 Assigned by {task.assignedBy?.name || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          title=""
          columns={tableColumns}
          data={filteredTasks}
          searchable={false}
          actions={(row) =>
            row.status !== 'Completed' ? (
              <select
                value={row.status}
                onChange={(e) => handleStatusChange(row._id, e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            ) : (
              <span style={{ color: '#2e7d32', fontSize: '12px', fontWeight: 600 }}>✓ Done</span>
            )
          }
        />
      )}
    </div>
  );
};

export default MyTasks;