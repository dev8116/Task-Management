import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineChartBar,
} from 'react-icons/hi';
import DashboardCard from '../../components/DashboardCard';
import PieChartComponent from '../../components/charts/PieChart';
import AreaChartComponent from '../../components/charts/AreaChart';
import CalendarView from '../../components/CalendarView';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const allTasks = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
  const myTasks = allTasks.filter((t) => t.assigneeId === user.id);
  const completed = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgress = myTasks.filter((t) => t.status === 'In Progress').length;
  const pending = myTasks.filter((t) => t.status === 'Pending').length;
  const completionRate = myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 0;

  const allAttendance = JSON.parse(localStorage.getItem('flowtrack_attendance') || '[]');
  const myAttendance = allAttendance.filter((a) => a.userId === user.id);
  const presentDays = myAttendance.filter((a) => a.status === 'Present').length;
  const attendanceRate = myAttendance.length > 0 ? Math.round((presentDays / myAttendance.length) * 100) : 100;

  const taskStatusData = [
    { name: 'Completed', value: completed || 0 },
    { name: 'In Progress', value: inProgress || 0 },
    { name: 'Pending', value: pending || 0 },
  ].filter((d) => d.value > 0);

  const performanceData = [
    { week: 'Week 1', tasks: 3 },
    { week: 'Week 2', tasks: 5 },
    { week: 'Week 3', tasks: 4 },
    { week: 'Week 4', tasks: 7 },
  ];

  const calendarEvents = myTasks
    .filter((t) => t.deadline)
    .map((t) => ({ date: t.deadline, title: t.title }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Welcome, {user.name}
          {user.managerName && (
            <span className="ml-2">
              · Manager: <span className="text-primary-600 dark:text-primary-400 font-medium">{user.managerName}</span>
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Assigned Tasks" value={myTasks.length} icon={HiOutlineClipboardList} color="primary" />
        <DashboardCard title="Completed" value={completed} icon={HiOutlineCheckCircle} color="green" />
        <DashboardCard title="Completion Rate" value={`${completionRate}%`} icon={HiOutlineChartBar} color="blue" />
        <DashboardCard title="Attendance" value={`${attendanceRate}%`} icon={HiOutlineClock} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent
          data={taskStatusData.length > 0 ? taskStatusData : [{ name: 'No Tasks', value: 1 }]}
          title="Task Status"
        />
        <AreaChartComponent data={performanceData} dataKey="tasks" xKey="week" title="Personal Performance" color="#6366f1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarView events={calendarEvents} />
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Upcoming Deadlines</h3>
          {myTasks
            .filter((t) => t.deadline && t.status !== 'Completed')
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5)
            .map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.projectName}</p>
                </div>
                <span className="text-xs text-gray-400">{t.deadline}</span>
              </div>
            ))}
          {myTasks.filter((t) => t.deadline && t.status !== 'Completed').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No upcoming deadlines</p>
          )}
        </div>
      </div>
    </div>
  );
}