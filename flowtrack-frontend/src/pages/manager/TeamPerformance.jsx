import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import BarChartComponent from '../../components/charts/BarChart';
import PieChartComponent from '../../components/charts/PieChart';
import LineChartComponent from '../../components/charts/LineChart';
import { getInitials } from '../../utils/helpers';
import { getAllUsers } from '../../services/userService';
import { getTasks } from '../../services/taskService';

export default function TeamPerformance() {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          getAllUsers(),
          getTasks(),
        ]);
        const allUsers = usersRes.data || usersRes || [];
        setMyTeam(allUsers.filter((u) => u.role === 'employee' && (u.managerId === (user._id || user.id))));
        setAllTasks(tasksRes.data || tasksRes || []);
      } catch (err) {
        console.error('Failed to fetch team performance data:', err);
      }
    };
    fetchData();
  }, [user]);

  const teamData = myTeam.map((emp) => {
    const empId = emp._id || emp.id;
    const empTasks = allTasks.filter((t) => t.assigneeId === empId || t.assignedTo === empId);
    const completed = empTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = empTasks.filter((t) => t.status === 'In Progress').length;
    const pending = empTasks.filter((t) => t.status === 'Pending').length;
    const rate = empTasks.length > 0 ? Math.round((completed / empTasks.length) * 100) : 0;
    return {
      id: empId,
      name: emp.name,
      department: emp.department || 'N/A',
      total: empTasks.length,
      completed,
      inProgress,
      pending,
      rate,
    };
  });

  const chartData = teamData.map((t) => ({
    name: t.name.split(' ')[0],
    completed: t.completed,
    pending: t.pending,
    inProgress: t.inProgress,
  }));

  const overallStatus = [
    { name: 'Completed', value: teamData.reduce((s, t) => s + t.completed, 0) || 1 },
    { name: 'In Progress', value: teamData.reduce((s, t) => s + t.inProgress, 0) || 1 },
    { name: 'Pending', value: teamData.reduce((s, t) => s + t.pending, 0) || 1 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Performance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your team's productivity</p>
      </div>

      {myTeam.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">No team members assigned to you yet</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamData.map((emp) => (
              <div key={emp.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
                    {getInitials(emp.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{emp.total}</p>
                    <p className="text-xs text-gray-500">Total Tasks</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{emp.rate}%</p>
                    <p className="text-xs text-gray-500">Completion</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${emp.rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartComponent data={chartData} dataKey="completed" xKey="name" title="Tasks Completed by Member" color="#10b981" />
            <PieChartComponent data={overallStatus} title="Overall Task Status" />
          </div>

          {chartData.length > 1 && (
            <LineChartComponent
              data={chartData}
              xKey="name"
              title="Task Distribution by Member"
              lines={[
                { dataKey: 'completed', name: 'Completed', color: '#10b981' },
                { dataKey: 'inProgress', name: 'In Progress', color: '#3b82f6' },
                { dataKey: 'pending', name: 'Pending', color: '#f59e0b' },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
