import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import DashboardCard from '../../components/Common/DashboardCard';
import ChartComponent from '../../components/Common/ChartComponent';
import CalendarView from '../../components/Common/CalendarView';
import {
  FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp, FiLogIn, FiLogOut,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './EmployeeDashboard.css';

const normalizeList = (res) => {
  if (!res) return [];
  const candidate = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(candidate) ? candidate : [];
};

const normalizeObject = (res) => {
  if (!res) return null;
  return res?.data?.data ?? res?.data ?? res ?? null;
};

const normalizeStatus = (s) => (s ? s.toLowerCase().trim().replace('_', ' ') : 'pending');

const deriveStatsFromTasks = (tasks) => {
  const stats = {
    totalTasks: tasks.length,
    completedTasks: 0,
    inProgressTasks: 0,
    onHoldTasks: 0,
    overdueTasks: 0,
    pendingTasks: 0,
  };
  const now = new Date();
  tasks.forEach((t) => {
    const status = normalizeStatus(t.status);
    const deadline = t.deadline ? new Date(t.deadline) : null;
    const overdue = deadline && deadline < now && status !== 'completed';
    if (overdue) stats.overdueTasks += 1;

    if (status === 'completed') stats.completedTasks += 1;
    else if (status === 'in progress' || status === 'in-progress') stats.inProgressTasks += 1;
    else if (status === 'on hold' || status === 'on-hold') stats.onHoldTasks += 1;
    else stats.pendingTasks += 1;
  });

  const done = stats.completedTasks;
  stats.completionRate = stats.totalTasks
    ? Math.round((done / stats.totalTasks) * 100)
    : 0;

  return stats;
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const derivedStats = deriveStatsFromTasks(safeTasks);
  const mergedPerf = {
    ...derivedStats,
    ...performance,
  };

  const now = new Date();

  const upcomingDeadlines = safeTasks
    .filter((t) => {
      if (!t) return false;
      const status = normalizeStatus(t.status);
      if (status === 'completed') return false;
      const deadline = t.deadline ? new Date(t.deadline) : null;
      if (!deadline || isNaN(deadline.getTime())) return false;
      const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 || deadline < now;
    })
    .sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
      const db = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
      return da - db;
    });

  const completedRecent = safeTasks
    .filter((t) => normalizeStatus(t.status) === 'completed')
    .sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline) : new Date(0);
      const db = b.deadline ? new Date(b.deadline) : new Date(0);
      return db - da;
    })
    .slice(0, 5);

  const taskChartData = [
    { name: 'Pending', value: mergedPerf.pendingTasks || 0 },
    { name: 'In Progress', value: mergedPerf.inProgressTasks || 0 },
    { name: 'On Hold', value: mergedPerf.onHoldTasks || 0 },
    { name: 'Completed', value: mergedPerf.completedTasks || 0 },
    { name: 'Overdue', value: mergedPerf.overdueTasks || 0 },
  ];

  const hasCheckedIn = !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayAttendance?.checkOut;

  const attendanceEvents = [];
  if (hasCheckedIn) {
    const today = new Date().toISOString().split('T')[0];
    attendanceEvents.push({ date: today });
  }

  const statusBadge = (statusRaw) => {
    const status = normalizeStatus(statusRaw);
    const cls = status.replace(/ /g, '-');
    return <span className={`status-badge ${cls}`}>{statusRaw || 'N/A'}</span>;
  };

  const deadlineLabel = (d, statusRaw) => {
    if (!d) return 'N/A';
    const deadline = new Date(d);
    if (deadline < now && normalizeStatus(statusRaw) !== 'completed') {
      return <span style={{ color: '#c00', fontWeight: 600 }}>OVERDUE</span>;
    }
    return deadline.toLocaleDateString();
  };

  // ✅ Single button: user clicks -> go to MyAttendance page to do selfie + check-in/out
  const openMyAttendance = () => navigate('/employee/attendance');

  const attendanceBtnLabel = !hasCheckedIn
    ? 'Check In'
    : !hasCheckedOut
    ? 'Check Out'
    : '✅ Done for today';

  const attendanceBtnClass = !hasCheckedIn
    ? 'quick-action-btn'
    : !hasCheckedOut
    ? 'quick-action-btn checked-in'
    : 'quick-action-btn checked-out';

  return (
    <div className="employee-dashboard">
      <h2>Employee Dashboard</h2>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className={attendanceBtnClass}
          onClick={openMyAttendance}
          disabled={hasCheckedIn && hasCheckedOut}
          title="Open My Attendance"
        >
          {!hasCheckedIn ? <FiLogIn /> : <FiLogOut />} {attendanceBtnLabel}
        </button>

        <button className="quick-action-btn" onClick={() => navigate('/employee/tasks')}>
          <FiCheckSquare /> My Tasks ({safeTasks.length})
        </button>

        <button className="quick-action-btn" onClick={() => navigate('/employee/leaves')}>
          <FiClock /> Apply Leave
        </button>

        <button className="quick-action-btn" onClick={() => navigate('/employee/performance')}>
          <FiTrendingUp /> Performance
        </button>
      </div>

      {/* Deadline Warnings */}
      {upcomingDeadlines.length > 0 && (
        <div className="deadline-warning">
          <h4><FiAlertCircle style={{ verticalAlign: 'middle' }} /> Upcoming & Overdue ({upcomingDeadlines.length})</h4>
          <ul>
            {upcomingDeadlines.map((t) => (
              <li key={t._id || t.id || Math.random()}>
                <span className="task-name">
                  {t.title} — <small style={{ color: '#888' }}>{t.project?.name || ''}</small>
                </span>
                <span className="task-date">{deadlineLabel(t.deadline, t.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recently Completed */}
      {completedRecent.length > 0 && (
        <div className="deadline-warning" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
          <h4>✅ Recently Completed ({completedRecent.length})</h4>
          <ul>
            {completedRecent.map((t) => (
              <li key={t._id || t.id || Math.random()}>
                <span className="task-name">
                  {t.title} — <small style={{ color: '#888' }}>{t.project?.name || ''}</small>
                </span>
                <span className="task-date">
                  {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Done'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-cards">
        <DashboardCard title="Total Tasks" value={mergedPerf.totalTasks || 0} icon={<FiCheckSquare />} color="#1a237e" />
        <DashboardCard title="Completed" value={mergedPerf.completedTasks || 0} icon={<FiCheckSquare />} color="#2e7d32" />
        <DashboardCard title="In Progress" value={mergedPerf.inProgressTasks || 0} icon={<FiClock />} color="#ef6c00" />
        <DashboardCard title="Completion Rate" value={`${mergedPerf.completionRate || 0}%`} icon={<FiTrendingUp />} color="#6a1b9a" />
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
              {safeTasks
                .slice()
                .sort((a, b) => {
                  const da = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
                  const db = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
                  return db - da;
                })
                .slice(0, 5)
                .map((t) => (
                  <tr key={t._id || t.id || Math.random()}>
                    <td style={{ padding: '10px 8px', fontSize: '14px', borderBottom: '1px solid #f5f5f5' }}>{t.title || 'Untitled'}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#666', borderBottom: '1px solid #f5f5f5' }}>{t.project?.name || 'N/A'}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #f5f5f5' }}>
                      {statusBadge(t.status)}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', borderBottom: '1px solid #f5f5f5' }}>
                      {deadlineLabel(t.deadline, t.status)}
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