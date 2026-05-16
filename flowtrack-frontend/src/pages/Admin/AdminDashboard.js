import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import ScrollContainer from '../../components/Common/ScrollContainer';
import { FiUsers, FiFolder, FiCheckSquare, FiUserCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [taskSummary, setTaskSummary] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, taskRes, usersRes] = await Promise.all([
        API.get('/reports/dashboard'),
        API.get('/reports/tasks-summary'),
        API.get('/users'),
      ]);
      setStats(statsRes.data || {});
      setTaskSummary(taskRes.data || {});
      const users = usersRes.data?.data ?? usersRes.data;
      setRecentUsers(Array.isArray(users) ? users.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const taskPieData = useMemo(() => ([
    { name: 'Pending', value: taskSummary.pending || 0 },
    { name: 'In Progress', value: taskSummary.inProgress || 0 },
    { name: 'Pending Approval', value: taskSummary.pendingApproval || 0 },
    { name: 'Completed', value: taskSummary.completed || 0 },
    { name: 'Overdue', value: taskSummary.overdue || 0 },
  ].filter((d) => d.value > 0)), [taskSummary]);

  const weeklyData = useMemo(() => (taskSummary.weeklyData || []).map((d) => ({
    name: d.day,
    completed: d.completed,
  })), [taskSummary]);

  const orgHealth = useMemo(() => {
    const total = Number(stats.totalTasks || 0);
    const completed = Number(stats.completedTasks || 0);
    const overdue = Number(stats.overdueTasks || 0);
    const pendingLeaves = Number(stats.pendingLeaves || 0);
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    let label = 'Stable';
    let tone = 'ok';
    if (overdue > 0 || pendingLeaves > 10) { label = 'Needs Attention'; tone = 'warn'; }
    if (overdue > 10) { label = 'Critical'; tone = 'bad'; }

    return { completionRate, label, tone, overdue, pendingLeaves };
  }, [stats]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-hero">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="admin-hero-subtitle">
            Overview of organization activity, workload, and user onboarding.
          </p>
        </div>

        <div className={`admin-health admin-health--${orgHealth.tone}`}>
          <div className="admin-health-title">Org Health</div>
          <div className="admin-health-metric">
            <span className="admin-health-rate">{orgHealth.completionRate}%</span>
            <span className="admin-health-label">{orgHealth.label}</span>
          </div>
          <div className="admin-health-meta">
            <span>Overdue: <b>{orgHealth.overdue}</b></span>
            <span>Pending Leaves: <b>{orgHealth.pendingLeaves}</b></span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpis">
        <DashboardCard title="Total Employees" value={stats.totalEmployees || 0} icon={<FiUsers />} color="#1a237e" />
        <DashboardCard title="Total Managers" value={stats.totalManagers || 0} icon={<FiUserCheck />} color="#00897b" />
        <DashboardCard title="Total Projects" value={stats.totalProjects || 0} icon={<FiFolder />} color="#6a1b9a" />
        <DashboardCard title="Total Tasks" value={stats.totalTasks || 0} icon={<FiCheckSquare />} color="#ef6c00" />
        <DashboardCard title="Completed" value={stats.completedTasks || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="Pending" value={stats.pendingTasks || 0} icon={<FiClock />} color="#f59e0b" />
        <DashboardCard title="In Progress" value={stats.inProgressTasks || 0} icon={<FiClock />} color="#0284c7" />
        <DashboardCard title="Overdue" value={stats.overdueTasks || 0} icon={<FiAlertCircle />} color="#c62828" />
        <DashboardCard title="Pending Leaves" value={stats.pendingLeaves || 0} icon={<FiClock />} color="#7c3aed" />
      </div>

      {/* Charts */}
      <div className="admin-grid">
        <div className="panel">
          <ChartComponent
            type="bar"
            data={weeklyData}
            title="Weekly Task Completion (last 7 days)"
            dataKey="completed"
            xKey="name"
          />
        </div>

        <div className="panel">
          <ChartComponent
            type="pie"
            data={taskPieData}
            title="Task Status Distribution"
            dataKey="value"
            xKey="name"
          />
        </div>
      </div>

      {/* Recent Users */}
      <div className="panel">
        <div className="panel-header">
          <h3>Recent Users</h3>
          <span className="panel-hint">Last 5 created users</span>
        </div>

        <ScrollContainer className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Manager', 'Status'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td>
                    <span className={`pill pill--role pill--${u.role}`}>{u.role}</span>
                  </td>
                  <td className="muted">{u.manager?.name || '—'}</td>
                  <td>
                    <span className={`pill ${u.isActive ? 'pill--ok' : 'pill--bad'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="table-empty">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollContainer>
      </div>

      {/* Calendar */}
      <div className="panel">
        <CalendarView />
      </div>
    </div>
  );
};

export default AdminDashboard;