import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import { FiFolder, FiCheckSquare, FiClock, FiUsers } from 'react-icons/fi';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [taskSummary, setTaskSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, projRes, teamRes, summaryRes] = await Promise.all([
        API.get('/reports/dashboard'),
        API.get('/projects'),
        API.get('/users/my-team'),
        API.get('/reports/tasks-summary'),
      ]);
      setStats(statsRes.data);
      setProjects(projRes.data);
      setTeamMembers(teamRes.data);
      setTaskSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="manager-dashboard">
      <h2>Manager Dashboard</h2>

      {/* Stats Cards */}
      <div className="dashboard-cards">
        <DashboardCard title="Assigned Projects" value={stats.assignedProjects || 0} icon={<FiFolder />} color="#1a237e" />
        <DashboardCard title="Team Members" value={stats.teamMembers || 0} icon={<FiUsers />} color="#6a1b9a" />
        <DashboardCard title="Total Tasks" value={stats.totalTasks || 0} icon={<FiCheckSquare />} color="#ef6c00" />
        <DashboardCard title="Completed Tasks" value={stats.completedTasks || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="Pending Tasks" value={stats.pendingTasks || 0} icon={<FiClock />} color="#c62828" />
        <DashboardCard title="In Progress" value={stats.inProgressTasks || 0} icon={<FiClock />} color="#00897b" />
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <ChartComponent type="bar" data={weeklyData} title="Weekly Productivity" dataKey="completed" xKey="name" />
        <ChartComponent type="pie" data={taskPieData} title="Task Distribution" dataKey="value" xKey="name" />
      </div>

      {/* My Projects */}
      <div className="team-section">
        <h3>My Projects ({projects.length})</h3>
        <div className="team-grid">
          {projects.map((project) => (
            <div key={project._id} className="team-card">
              <div className="team-card-avatar" style={{ background: '#1a237e' }}>
                {project.name?.charAt(0).toUpperCase()}
              </div>
              <div className="team-card-info">
                <h4>{project.name}</h4>
                <p>{project.status} • {project.team?.length || 0} members</p>
              </div>
              <div className="team-card-stats">
                <div className="stat">Progress</div>
                <div className="stat-value">{project.progress || 0}%</div>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p style={{ color: '#888' }}>No projects assigned yet</p>}
        </div>
      </div>

      {/* Team Members */}
      <div className="team-section">
        <h3>My Team ({teamMembers.length})</h3>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member._id} className="team-card">
              <div className="team-card-avatar">
                {getInitials(member.name)}
              </div>
              <div className="team-card-info">
                <h4>{member.name}</h4>
                <p>{member.email}</p>
                <p style={{ color: '#666', fontSize: '11px' }}>{member.department || 'No Department'}</p>
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && <p style={{ color: '#888' }}>No team members assigned yet</p>}
        </div>
      </div>

      {/* Calendar */}
      <div className="dashboard-bottom" style={{ marginTop: '30px' }}>
        <CalendarView />
      </div>
    </div>
  );
};

export default ManagerDashboard;