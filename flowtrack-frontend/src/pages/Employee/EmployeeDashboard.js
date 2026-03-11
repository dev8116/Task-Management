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

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState({});
  const [tasks, setTasks] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perfRes, taskRes, attRes] = await Promise.all([
        API.get('/reports/my-performance'),
        API.get('/tasks'),
        API.get('/attendance/today'),
      ]);
      setPerformance(perfRes.data);
      setTasks(taskRes.data);
      setTodayAttendance(attRes.data);
    } catch (err) {
      console.error('Failed to load dashboard');
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

  const upcomingDeadlines = tasks
    .filter((t) => {
      if (t.status === 'Completed') return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const diff = (deadline - now) / (1000 * 60 * 60 * 24);
      return diff <= 3;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

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
        <button className="quick-action-btn" onClick={() => navigate('/employee/tasks')}><FiCheckSquare /> My Tasks ({tasks.length})</button>
        <button className="quick-action-btn" onClick={() => navigate('/employee/leaves')}><FiClock /> Apply Leave</button>
        <button className="quick-action-btn" onClick={() => navigate('/employee/performance')}><FiTrendingUp /> Performance</button>
      </div>

      {/* Deadline Warnings */}
      {upcomingDeadlines.length > 0 && (
        <div className="deadline-warning">
          <h4><FiAlertCircle style={{ verticalAlign: 'middle' }} /> Upcoming Deadlines ({upcomingDeadlines.length})</h4>
          <ul>
            {upcomingDeadlines.map((t) => (
              <li key={t._id}>
                <span className="task-name">{t.title} — <small style={{ color: '#888' }}>{t.project?.name || ''}</small></span>
                <span className="task-date">
                  {new Date(t.deadline) < new Date() ? 'OVERDUE' : new Date(t.deadline).toLocaleDateString()}
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
      {tasks.length > 0 && (
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
              {tasks.slice(0, 5).map((t) => (
                <tr key={t._id}>
                  <td style={{ padding: '10px 8px', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>{t.title}</td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>{t.project?.name || 'N/A'}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                    <span className={`status-badge ${t.status?.toLowerCase().replace(/ /g, '-')}`}>{t.status}</span>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: '13px', borderBottom: '1px solid #f5f5f5' }}>
                    {new Date(t.deadline).toLocaleDateString()}
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