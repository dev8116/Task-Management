import { useAuth } from '../../context/AuthContext';
import BarChartComponent from '../../components/charts/BarChart';
import AreaChartComponent from '../../components/charts/AreaChart';
import PieChartComponent from '../../components/charts/PieChart';
import LineChartComponent from '../../components/charts/LineChart';

export default function PerformanceDashboard() {
  const { user } = useAuth();

  const allTasks = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
  const myTasks = allTasks.filter((t) => t.assigneeId === user.id);

  const completed = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgress = myTasks.filter((t) => t.status === 'In Progress').length;
  const pending = myTasks.filter((t) => t.status === 'Pending').length;
  const total = myTasks.length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const allAttendance = JSON.parse(localStorage.getItem('flowtrack_attendance') || '[]');
  const myAttendance = allAttendance.filter((a) => a.userId === user.id);
  const presentDays = myAttendance.filter((a) => a.status === 'Present').length;
  const totalHours = myAttendance.reduce((s, a) => s + (a.hours || 0), 0);
  const avgHours = presentDays > 0 ? (totalHours / presentDays).toFixed(1) : 0;

  const taskStatusData = [
    { name: 'Completed', value: completed || 0 },
    { name: 'In Progress', value: inProgress || 0 },
    { name: 'Pending', value: pending || 0 },
  ].filter((d) => d.value > 0);

  const priorityData = [
    { name: 'High', value: myTasks.filter((t) => t.priority === 'High').length || 0 },
    { name: 'Medium', value: myTasks.filter((t) => t.priority === 'Medium').length || 0 },
    { name: 'Low', value: myTasks.filter((t) => t.priority === 'Low').length || 0 },
  ].filter((d) => d.value > 0);

  const weeklyData = [
    { week: 'Week 1', completed: 2, hours: 40 },
    { week: 'Week 2', completed: 4, hours: 42 },
    { week: 'Week 3', completed: 3, hours: 38 },
    { week: 'Week 4', completed: 5, hours: 45 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Performance Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your personal performance metrics
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{total}</p>
          <p className="text-xs text-gray-500">Total Tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{rate}%</p>
          <p className="text-xs text-gray-500">Completion Rate</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-600">{presentDays}</p>
          <p className="text-xs text-gray-500">Days Present</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600">{avgHours}h</p>
          <p className="text-xs text-gray-500">Avg Hours/Day</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent
          data={taskStatusData.length > 0 ? taskStatusData : [{ name: 'No Tasks', value: 1 }]}
          title="Task Status Breakdown"
        />
        <PieChartComponent
          data={priorityData.length > 0 ? priorityData : [{ name: 'No Tasks', value: 1 }]}
          title="Tasks by Priority"
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent
          data={weeklyData}
          dataKey="completed"
          xKey="week"
          title="Weekly Tasks Completed"
          color="#6366f1"
        />
        <AreaChartComponent
          data={weeklyData}
          dataKey="hours"
          xKey="week"
          title="Weekly Working Hours"
          color="#10b981"
        />
      </div>

      {/* Charts Row 3 */}
      <LineChartComponent
        data={weeklyData}
        xKey="week"
        title="Performance Trend"
        lines={[
          { dataKey: 'completed', name: 'Tasks Completed', color: '#6366f1' },
          { dataKey: 'hours', name: 'Hours Worked', color: '#10b981' },
        ]}
      />

      {/* Performance Summary Card */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Performance Summary
        </h3>
        <div className="space-y-4">
          {/* Task Completion */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Task Completion Rate</span>
              <span className="font-semibold text-gray-900 dark:text-white">{rate}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>

          {/* Attendance Rate */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {myAttendance.length > 0
                  ? Math.round((presentDays / myAttendance.length) * 100)
                  : 100}
                %
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    myAttendance.length > 0
                      ? Math.round((presentDays / myAttendance.length) * 100)
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Productivity Score */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Productivity Score</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.min(
                  Math.round(
                    (rate * 0.6 +
                      (myAttendance.length > 0
                        ? (presentDays / myAttendance.length) * 100
                        : 100) *
                        0.4)
                  ),
                  100
                )}
                %
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.round(
                      rate * 0.6 +
                        (myAttendance.length > 0
                          ? (presentDays / myAttendance.length) * 100
                          : 100) *
                          0.4
                    ),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}