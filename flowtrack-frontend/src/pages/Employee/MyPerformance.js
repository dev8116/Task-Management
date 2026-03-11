import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import { toast } from 'react-toastify';
import { FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp, FiCalendar, FiAward } from 'react-icons/fi';

const MyPerformance = () => {
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const { data } = await API.get('/reports/my-performance');
      setPerformance(data);
    } catch (err) {
      toast.error('Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const taskDistribution = [
    { name: 'Completed', value: performance.completedTasks || 0 },
    { name: 'In Progress', value: performance.inProgressTasks || 0 },
    { name: 'Pending', value: performance.pendingTasks || 0 },
    { name: 'Overdue', value: performance.overdueTasks || 0 },
  ];

  const performanceData = [
    { name: 'Tasks', value: performance.totalTasks || 0 },
    { name: 'Completed', value: performance.completedTasks || 0 },
    { name: 'Overdue', value: performance.overdueTasks || 0 },
    { name: 'Attendance', value: performance.presentDays || 0 },
  ];

  const getPerformanceLevel = (rate) => {
    if (rate >= 90) return { label: 'Excellent', color: '#2e7d32', emoji: '🏆' };
    if (rate >= 70) return { label: 'Good', color: '#1565c0', emoji: '⭐' };
    if (rate >= 50) return { label: 'Average', color: '#ef6c00', emoji: '📊' };
    return { label: 'Needs Improvement', color: '#c62828', emoji: '📈' };
  };

  const level = getPerformanceLevel(performance.completionRate || 0);

  return (
    <div>
      <div className="page-header"><h2>My Performance</h2></div>

      {/* Performance Level */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center',
      }} className="dark-card">
        <div style={{ fontSize: '48px' }}>{level.emoji}</div>
        <h3 style={{ fontSize: '22px', color: level.color, marginTop: '8px' }}>{level.label}</h3>
        <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
          Task Completion Rate: <strong style={{ fontSize: '24px', color: level.color }}>{performance.completionRate || 0}%</strong>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-cards">
        <DashboardCard title="Total Tasks" value={performance.totalTasks || 0} icon={<FiCheckSquare />} color="#1a237e" />
        <DashboardCard title="Completed" value={performance.completedTasks || 0} icon={<FiAward />} color="#2e7d32" />
        <DashboardCard title="In Progress" value={performance.inProgressTasks || 0} icon={<FiClock />} color="#ef6c00" />
        <DashboardCard title="Overdue" value={performance.overdueTasks || 0} icon={<FiAlertCircle />} color="#c62828" />
        <DashboardCard title="Present Days" value={performance.presentDays || 0} icon={<FiCalendar />} color="#00897b" />
        <DashboardCard title="Completion Rate" value={`${performance.completionRate || 0}%`} icon={<FiTrendingUp />} color="#6a1b9a" />
      </div>

      {/* Charts */}
      <div className="dashboard-charts" style={{ marginTop: '24px' }}>
        <ChartComponent type="pie" data={taskDistribution} title="Task Distribution" dataKey="value" xKey="name" />
        <ChartComponent type="bar" data={performanceData} title="Performance Overview" dataKey="value" xKey="name" />
      </div>
    </div>
  );
};

export default MyPerformance;