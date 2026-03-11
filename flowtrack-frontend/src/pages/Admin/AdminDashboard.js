import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import { FiUsers, FiFolder, FiCheckSquare, FiUserCheck, FiClock } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [taskSummary, setTaskSummary] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, taskRes, usersRes] = await Promise.all([
        API.get('/reports/dashboard'),
        API.get('/reports/tasks-summary'),
        API.get('/users'),
      ]);
      setStats(statsRes.data);
      setTaskSummary(taskRes.data);
      setRecentUsers(usersRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  const taskPieData = [
    { name: 'Pending', value: taskSummary.pending || 0 },
    { name: 'In Progress', value: taskSummary.inProgress || 0 },
    { name: 'Completed', value: taskSummary.completed || 0 },
    { name: 'Overdue', value: taskSummary.overdue || 0 },
  ];

  const weeklyData = (taskSummary.weeklyData || []).map((d) => ({
    name: d.day,
    completed: d.completed,
  }));

  return (
    <div className="dashboard-page">
      <h2>Admin Dashboard</h2>

      <div className="dashboard-cards">
        <DashboardCard title="Total Employees" value={stats.totalEmployees || 0} icon={<FiUsers />} color="#1a237e" />
        <DashboardCard title="Total Managers" value={stats.totalManagers || 0} icon={<FiUserCheck />} color="#00897b" />
        <DashboardCard title="Total Projects" value={stats.totalProjects || 0} icon={<FiFolder />} color="#6a1b9a" />
        <DashboardCard title="Total Tasks" value={stats.totalTasks || 0} icon={<FiCheckSquare />} color="#ef6c00" />
        <DashboardCard title="Completed Tasks" value={stats.completedTasks || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="Pending Leaves" value={stats.pendingLeaves || 0} icon={<FiClock />} color="#c62828" />
      </div>

      <div className="dashboard-charts">
        <ChartComponent type="line" data={weeklyData} title="Weekly Task Completion" dataKey="completed" xKey="name" />
        <ChartComponent type="pie" data={taskPieData} title="Task Status Overview" dataKey="value" xKey="name" />
      </div>

      {/* System Flow Summary */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>System Relationship Flow</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '16px 24px', background: '#e3f2fd', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1565c0' }}>Admin</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Creates Managers, Employees, Projects</div>
          </div>
          <div style={{ fontSize: '24px', color: '#888' }}>→</div>
          <div style={{ textAlign: 'center', padding: '16px 24px', background: '#f3e5f5', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#7b1fa2' }}>Manager</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Creates Tasks, Assigns to Team</div>
          </div>
          <div style={{ fontSize: '24px', color: '#888' }}>→</div>
          <div style={{ textAlign: 'center', padding: '16px 24px', background: '#e8f5e9', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2e7d32' }}>Employee</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Works on Tasks, Updates Status</div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Users</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'Manager', 'Status'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u._id}>
                <td style={{ padding: '10px 8px', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>{u.name}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>{u.email}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                  <span className={`status-badge`} style={{
                    background: u.role === 'admin' ? '#e3f2fd' : u.role === 'manager' ? '#f3e5f5' : '#e8f5e9',
                    color: u.role === 'admin' ? '#1565c0' : u.role === 'manager' ? '#7b1fa2' : '#2e7d32',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>
                  {u.manager?.name || '--'}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                  <span className={`status-badge ${u.isActive ? 'approved' : 'rejected'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-bottom">
        <CalendarView />
      </div>
    </div>
  );
};

export default AdminDashboard;