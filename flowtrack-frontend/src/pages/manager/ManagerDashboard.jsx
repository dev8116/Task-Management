import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineFolder, HiOutlineClipboardList, HiOutlineUsers, HiOutlineCheckCircle } from 'react-icons/hi';
import DashboardCard from '../../components/DashboardCard';
import BarChartComponent from '../../components/charts/BarChart';
import PieChartComponent from '../../components/charts/PieChart';
import LineChartComponent from '../../components/charts/LineChart';
import ProjectProgressBar from '../../components/ProjectProgressBar';
import { getAllUsers } from '../../services/userService';
import { getTasks } from '../../services/taskService';
import axiosInstance from '../../api/axiosInstance';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, tasksRes, projectsRes] = await Promise.all([
          getAllUsers(),
          getTasks(),
          axiosInstance.get('/projects'),
        ]);

        const allUsers = usersRes.data || usersRes || [];
        const team = allUsers.filter((u) => u.role === 'employee' && (u.managerId === (user._id || user.id)));
        setMyTeam(team);

        const allTasks = tasksRes.data || tasksRes || [];
        const teamIds = team.map((t) => t._id || t.id);
        const tasks = allTasks.filter((t) => teamIds.includes(t.assigneeId || t.assignedTo));
        setMyTasks(tasks);

        const allProjects = projectsRes.data?.data || projectsRes.data || [];
        setMyProjects(allProjects.filter((p) => p.managerId === (user._id || user.id)));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, [user]);

  const completed = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgress = myTasks.filter((t) => t.status === 'In Progress').length;
  const pending = myTasks.filter((t) => t.status === 'Pending').length;

  const taskDistribution = [
    { name: 'Completed', value: completed || 1 },
    { name: 'In Progress', value: inProgress || 1 },
    { name: 'Pending', value: pending || 1 },
  ];

  const teamPerformance = myTeam.map((emp) => {
    const empId = emp._id || emp.id;
    const empTasks = myTasks.filter((t) => t.assigneeId === empId || t.assignedTo === empId);
    const empCompleted = empTasks.filter((t) => t.status === 'Completed').length;
    return { name: emp.name.split(' ')[0], completed: empCompleted, total: empTasks.length };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="My Projects" value={myProjects.length} icon={HiOutlineFolder} color="primary" />
        <DashboardCard title="Team Members" value={myTeam.length} icon={HiOutlineUsers} color="blue" />
        <DashboardCard title="Total Tasks" value={myTasks.length} icon={HiOutlineClipboardList} color="yellow" />
        <DashboardCard title="Completed" value={completed} icon={HiOutlineCheckCircle} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent data={taskDistribution} title="Task Distribution" />
        <BarChartComponent data={weeklyData} dataKey="tasks" xKey="day" title="Team Weekly Productivity" color="#6366f1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamPerformance.length > 0 && (
          <LineChartComponent data={teamPerformance} xKey="name" title="Employee Performance"
            lines={[
              { dataKey: 'completed', name: 'Completed', color: '#10b981' },
              { dataKey: 'total', name: 'Total Assigned', color: '#6366f1' },
            ]}
          />
        )}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h3>
          {myProjects.length > 0 ? myProjects.map((p, i) => {
            const colors = ['primary', 'green', 'yellow', 'blue'];
            return <ProjectProgressBar key={p._id || p.id} name={p.name} progress={p.progress || 0} color={colors[i % colors.length]} />;
          }) : <p className="text-sm text-gray-400">No projects assigned yet</p>}
        </div>
      </div>
    </div>
  );
}
