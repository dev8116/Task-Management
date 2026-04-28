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

  // Guard against undefined / null so charts never break
  const safe = (n) => (Number.isFinite(n) ? n : 0);

  const taskDistribution = [
    { name: 'Completed',   value: safe(performance.completedTasks) },
    { name: 'In Progress', value: safe(performance.inProgressTasks) },
    { name: 'Pending',     value: safe(performance.pendingTasks) },
    { name: 'Overdue',     value: safe(performance.overdueTasks) },
  ];

  const performanceData = [
    { name: 'Tasks',      value: safe(performance.totalTasks) },
    { name: 'Completed',  value: safe(performance.completedTasks) },
    { name: 'Overdue',    value: safe(performance.overdueTasks) },
    { name: 'Attendance', value: safe(performance.presentDays) },
  ];

  const getPerformanceLevel = (rate) => {
    if (rate >= 90) return { label: 'Excellent', color: '#2e7d32', emoji: '🏆' };
    if (rate >= 70) return { label: 'Good', color: '#1565c0', emoji: '⭐' };
    if (rate >= 50) return { label: 'Average', color: '#ef6c00', emoji: '📊' };
    return { label: 'Needs Improvement', color: '#c62828', emoji: '📈' };
  };

  const level = getPerformanceLevel(safe(performance.completionRate));

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
          Task Completion Rate: <strong style={{ fontSize: '24px', color: level.color }}>{safe(performance.completionRate)}%</strong>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-cards">
        <DashboardCard title="Total Tasks" value={safe(performance.totalTasks)} icon={<FiCheckSquare />} color="#1a237e" />
        <DashboardCard title="Completed" value={safe(performance.completedTasks)} icon={<FiAward />} color="#2e7d32" />
        <DashboardCard title="In Progress" value={safe(performance.inProgressTasks)} icon={<FiClock />} color="#ef6c00" />
        <DashboardCard title="Overdue" value={safe(performance.overdueTasks)} icon={<FiAlertCircle />} color="#c62828" />
        <DashboardCard title="Present Days" value={safe(performance.presentDays)} icon={<FiCalendar />} color="#00897b" />
        <DashboardCard title="Completion Rate" value={`${safe(performance.completionRate)}%`} icon={<FiTrendingUp />} color="#6a1b9a" />
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