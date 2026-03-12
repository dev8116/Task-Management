import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import { FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp, FiLogIn, FiLogOut, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './EmployeeDashboard.css';

const normalizeList = (res) => {
  // Some endpoints return { data: [...] } or { data: { data: [...] } } or [...], so normalize to array
  if (!res) return [];
  const candidate = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(candidate) ? candidate : [];
};

const normalizeObject = (res) => {
  // Normalize single-object responses to object or null
  if (!res) return null;
  return res?.data?.data ?? res?.data ?? res ?? null;
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState({});
  const [tasks, setTasks] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [perfRes, taskRes, attRes] = await Promise.all([
        API.get('/reports/my-performance'),
        API.get('/tasks'),
        API.get('/attendance/today'),
      ]);

      const perfData = normalizeObject(perfRes) ?? {};
      const tasksData = normalizeList(taskRes);
      const attData = normalizeObject(attRes);

      setPerformance(perfData);
      setTasks(tasksData);
      setTodayAttendance(attData);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      toast.error('Failed to load dashboard data');
      // keep current state but stop loading
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await API.post('/attendance/check-in');
      toast.success('Checked in successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await API.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  // Ensure tasks is an array before using array methods
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const upcomingDeadlines = safeTasks
    .filter((t) => {
      if (!t) return false;
      if (t.status === 'Completed') return false;
      const deadline = t.deadline ? new Date(t.deadline) : null;
      if (!deadline || isNaN(deadline.getTime())) return false;
      const now = new Date();
      const diff = (deadline - now) / (1000 * 60 * 60 * 24);
      return diff <= 3;
    })
    .sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline) : new Date(0);
      const db = b.deadline ? new Date(b.deadline) : new Date(0);
      return da - db;
    });

  const taskChartData = [
    { name: 'Pending', value: performance.pendingTasks || 0 },
    { name: 'In Progress', value: performance.inProgressTasks || 0 },
    { name: 'Completed', value: performance.completedTasks || 0 },
    { name: 'Overdue', value: performance.overdueTasks || 0 },
  ];

  const hasCheckedIn = todayAttendance?.checkIn;
  const hasCheckedOut = todayAttendance?.checkOut;

  const attendanceEvents = [];
  if (hasCheckedIn) {
    const today = new Date().toISOString().split('T')[0];
    attendanceEvents.push({ date: today });
  }

  return (
    <div className="employee-dashboard">
      <h2>Employee Dashboard</h2>

      {/* Quick Actions */}
      <div className="quick-actions">
        {!hasCheckedIn ? (
          <button className="quick-action-btn" onClick={handleCheckIn}><FiLogIn /> Check In</button>
        ) : !hasCheckedOut ? (
          <button className="quick-action-btn checked-in" onClick={handleCheckOut}><FiLogOut /> Check Out</button>
        ) : (
          <button className="quick-action-btn checked-out" disabled>✅ Done for today</button>
        )}
        <button className="quick-action-btn" onClick={() => navigate('/employee/tasks')}>
          <FiCheckSquare /> My Tasks ({safeTasks.length})
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/employee/leaves')}><FiClock /> Apply Leave</button>
        <button className="quick-action-btn" onClick={() => navigate('/employee/performance')}><FiTrendingUp /> Performance</button>
      </div>

      {/* Deadline Warnings */}
      {upcomingDeadlines.length > 0 && (
        <div className="deadline-warning">
          <h4><FiAlertCircle style={{ verticalAlign: 'middle' }} /> Upcoming Deadlines ({upcomingDeadlines.length})</h4>
          <ul>
            {upcomingDeadlines.map((t) => (
              <li key={t._id || t.id || Math.random()}>
                <span className="task-name">{t.title} — <small style={{ color: '#888' }}>{t.project?.name || ''}</small></span>
                <span className="task-date">
                  {t.deadline && new Date(t.deadline) < new Date() ? 'OVERDUE' : (t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-cards">
        <DashboardCard title="Total Tasks" value={performance.totalTasks || 0} icon={<FiCheckSquare />} color="#1a237e" />
        <DashboardCard title="Completed" value={performance.completedTasks || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="In Progress" value={performance.inProgressTasks || 0} icon={<FiClock />} color="#ef6c00" />
        <DashboardCard title="Completion Rate" value={`${performance.completionRate || 0}%`} icon={<FiTrendingUp />} color="#6a1b9a" />
      </div>

      {/* Recent Tasks */}
      {safeTasks.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Tasks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee' }}>Task</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee' }}>Project</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee' }}>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {safeTasks.slice(0, 5).map((t) => (
                <tr key={t._id || t.id || Math.random()}>
                  <td style={{ padding: '10px 8px', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>{t.title || 'Untitled'}</td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>{t.project?.name || 'N/A'}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                    <span className={`status-badge ${String(t.status || '').toLowerCase().replace(/ /g, '-')}`}>{t.status || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', borderBottom: '1px solid #f5f5f5' }}>
                    {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts */}
      <div className="dashboard-charts">
        <ChartComponent type="pie" data={taskChartData} title="My Task Overview" dataKey="value" xKey="name" />
        <CalendarView events={attendanceEvents} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;