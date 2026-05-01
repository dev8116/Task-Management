import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import { FiFolder, FiCheckSquare, FiClock, FiUsers, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [taskSummary, setTaskSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, projRes, teamRes, summaryRes] = await Promise.all([
        API.get('/reports/dashboard'),
        API.get('/projects'),
        API.get('/users/my-team'),
        API.get('/reports/tasks-summary'),
      ]);

      setStats(statsRes.data || {});
      const proj = projRes.data?.data ?? projRes.data;
      const team = teamRes.data?.data ?? teamRes.data;
      setProjects(Array.isArray(proj) ? proj : []);
      setTeamMembers(Array.isArray(team) ? team : []);
      setTaskSummary(summaryRes.data || {});
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const teamPulse = useMemo(() => {
    const overdue = Number(stats.overdueTasks || 0);
    const inProgress = Number(stats.inProgressTasks || 0);
    const completed = Number(stats.completedTasks || 0);
    const total = Number(stats.totalTasks || 0);
    const rate = total ? Math.round((completed / total) * 100) : 0;

    let label = 'On Track';
    let tone = 'ok';
    if (overdue > 0) { label = 'Watch Overdue'; tone = 'warn'; }
    if (overdue > 5) { label = 'At Risk'; tone = 'bad'; }

    return { overdue, inProgress, rate, label, tone };
  }, [stats]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div className="manager-dashboard">
      <div className="manager-hero">
        <div>
          <h2>Manager Dashboard</h2>
          <p className="manager-hero-subtitle">Track team delivery, projects, and workload.</p>
        </div>

        <div className={`manager-pulse manager-pulse--${teamPulse.tone}`}>
          <div className="manager-pulse-top">
            <FiTrendingUp />
            <span>Team Pulse</span>
          </div>
          <div className="manager-pulse-rate">{teamPulse.rate}%</div>
          <div className="manager-pulse-label">{teamPulse.label}</div>
          <div className="manager-pulse-meta">
            <span>Overdue: <b>{teamPulse.overdue}</b></span>
            <span>In Progress: <b>{teamPulse.inProgress}</b></span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-cards">
        <DashboardCard title="Assigned Projects" value={stats.assignedProjects || 0} icon={<FiFolder />} color="#1a237e" />
        <DashboardCard title="Team Members" value={stats.teamMembers || 0} icon={<FiUsers />} color="#6a1b9a" />
        <DashboardCard title="Total Tasks" value={stats.totalTasks || 0} icon={<FiCheckSquare />} color="#ef6c00" />
        <DashboardCard title="Completed" value={stats.completedTasks || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="Pending" value={stats.pendingTasks || 0} icon={<FiClock />} color="#f59e0b" />
        <DashboardCard title="In Progress" value={stats.inProgressTasks || 0} icon={<FiClock />} color="#0284c7" />
        <DashboardCard title="Overdue" value={stats.overdueTasks || 0} icon={<FiAlertCircle />} color="#c62828" />
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <ChartComponent
          type="bar"
          data={weeklyData}
          title="Weekly Productivity (tasks completed)"
          dataKey="completed"
          xKey="name"
        />
        <ChartComponent
          type="pie"
          data={taskPieData}
          title="Task Distribution"
          dataKey="value"
          xKey="name"
        />
      </div>

      {/* Projects + Team side-by-side on desktop */}
      <div className="manager-sections">
        <div className="team-section">
          <h3>My Projects ({projects.length})</h3>
          <div className="team-grid">
            {projects.map((project) => (
              <div key={project._id} className="team-card">
                <div className="team-card-avatar" style={{ background: '#1a237e' }}>
                  {(project.name || project.title)?.charAt(0).toUpperCase()}
                </div>
                <div className="team-card-info">
                  <h4>{project.name || project.title}</h4>
                  <p>{project.status} • {project.team?.length || 0} members</p>
                </div>
                <div className="team-card-stats">
                  <div className="stat">Progress</div>
                  <div className="stat-value">{project.progress || 0}%</div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p style={{ color: '#888', fontSize: '14px' }}>No projects assigned yet</p>
            )}
          </div>
        </div>

        <div className="team-section">
          <h3>My Team ({teamMembers.length})</h3>
          <div className="team-grid team-grid--compact">
            {teamMembers.map((member) => (
              <div key={member._id} className="team-card team-card--compact">
                <div className="team-card-avatar">{getInitials(member.name)}</div>
                <div className="team-card-info">
                  <h4>{member.name}</h4>
                  <p>{member.email}</p>
                  <p className="muted-small">{member.department || 'No Department'}</p>
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p style={{ color: '#888', fontSize: '14px' }}>No team members assigned yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <CalendarView />
      </div>
    </div>
  );
};

export default ManagerDashboard;