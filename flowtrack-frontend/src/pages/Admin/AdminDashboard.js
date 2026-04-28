import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import { FiUsers, FiFolder, FiCheckSquare, FiUserCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats]           = useState({});
  const [taskSummary, setTaskSummary] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, taskRes, usersRes] = await Promise.all([
        API.get('/reports/dashboard'),
        API.get('/reports/tasks-summary'),
        API.get('/users'),
      ]);
      setStats(statsRes.data);
      setTaskSummary(taskRes.data);
      // Handle both plain array and { data: [...] } shapes
      const users = usersRes.data?.data ?? usersRes.data;
      setRecentUsers(Array.isArray(users) ? users.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  // ✅ Chart data — uses lowercase keys returned by fixed reportController
  const taskPieData = [
    { name: 'Pending',          value: taskSummary.pending          || 0 },
    { name: 'In Progress',      value: taskSummary.inProgress       || 0 },
    { name: 'Pending Approval', value: taskSummary.pendingApproval  || 0 },
    { name: 'Completed',        value: taskSummary.completed        || 0 },
    { name: 'Overdue',          value: taskSummary.overdue          || 0 },
  ].filter((d) => d.value > 0); // hide zero-value slices

  const weeklyData = (taskSummary.weeklyData || []).map((d) => ({
    name:      d.day,
    completed: d.completed,
  }));

  return (
    <div className="dashboard-page">
      <h2>Admin Dashboard</h2>

      {/* ── Stats Cards ── */}
      <div className="dashboard-cards">
        <DashboardCard title="Total Employees"  value={stats.totalEmployees  || 0} icon={<FiUsers />}       color="#1a237e" />
        <DashboardCard title="Total Managers"   value={stats.totalManagers   || 0} icon={<FiUserCheck />}   color="#00897b" />
        <DashboardCard title="Total Projects"   value={stats.totalProjects   || 0} icon={<FiFolder />}      color="#6a1b9a" />
        <DashboardCard title="Total Tasks"      value={stats.totalTasks      || 0} icon={<FiCheckSquare />} color="#ef6c00" />
        <DashboardCard title="Completed Tasks"  value={stats.completedTasks  || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="Pending Tasks"    value={stats.pendingTasks    || 0} icon={<FiClock />}       color="#f59e0b" />
        <DashboardCard title="In Progress"      value={stats.inProgressTasks || 0} icon={<FiClock />}       color="#0284c7" />
        <DashboardCard title="Overdue Tasks"    value={stats.overdueTasks    || 0} icon={<FiAlertCircle />} color="#c62828" />
        <DashboardCard title="Pending Leaves"   value={stats.pendingLeaves   || 0} icon={<FiClock />}       color="#7c3aed" />
      </div>

      {/* ── Charts ── */}
      <div className="dashboard-charts">
        <ChartComponent
          type="bar"
          data={weeklyData}
          title="Weekly Task Completion (last 7 days)"
          dataKey="completed"
          xKey="name"
        />
        <ChartComponent
          type="pie"
          data={taskPieData}
          title="Task Status Distribution"
          dataKey="value"
          xKey="name"
        />
      </div>

      {/* ── System Flow ── */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px',
        marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          System Relationship Flow
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {[
            { role: 'Admin',    desc: 'Creates Managers, Employees, Projects', bg: '#e3f2fd', color: '#1565c0' },
            { role: 'Manager',  desc: 'Creates Tasks, Assigns to Team',         bg: '#f3e5f5', color: '#7b1fa2' },
            { role: 'Employee', desc: 'Works on Tasks, Uploads Proof',           bg: '#e8f5e9', color: '#2e7d32' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.role}>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: item.bg, borderRadius: '10px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: item.color }}>{item.role}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>{item.desc}</div>
              </div>
              {idx < arr.length - 1 && <div style={{ fontSize: '24px', color: '#888' }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Recent Users ── */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '20px',
        marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Users</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'Manager', 'Status'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u._id}>
                <td style={{ padding: '10px 8px', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>{u.name}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>{u.email}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500,
                    background: u.role === 'admin' ? '#e3f2fd' : u.role === 'manager' ? '#f3e5f5' : '#e8f5e9',
                    color:      u.role === 'admin' ? '#1565c0' : u.role === 'manager' ? '#7b1fa2' : '#2e7d32',
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>
                  {u.manager?.name || '—'}
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '12px',
                    background: u.isActive ? '#e8f5e9' : '#fce4ec',
                    color:      u.isActive ? '#2e7d32' : '#c62828',
                  }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>No users found</td>
              </tr>
            )}
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