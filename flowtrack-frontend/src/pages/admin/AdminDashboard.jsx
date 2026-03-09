import { useState, useEffect } from 'react';
import { HiOutlineUsers, HiOutlineFolder, HiOutlineCheckCircle, HiOutlineChartBar } from 'react-icons/hi';
import DashboardCard from '../../components/DashboardCard';
import BarChartComponent from '../../components/charts/BarChart';
import LineChartComponent from '../../components/charts/LineChart';
import PieChartComponent from '../../components/charts/PieChart';
import ProjectProgressBar from '../../components/ProjectProgressBar';
import { getAllUsers } from '../../services/userService';
import axiosInstance from '../../api/axiosInstance';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([
    { name: 'Completed', value: 0 },
    { name: 'In Progress', value: 0 },
    { name: 'Pending', value: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          getAllUsers(),
          axiosInstance.get('/projects'),
        ]);
        setUsers(usersRes.data || usersRes || []);
        const projectList = projectsRes.data?.data || projectsRes.data || [];
        setProjects(projectList);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  const managers = users.filter((u) => u.role === 'manager');
  const employees = users.filter((u) => u.role === 'employee');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your organization</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Employees" value={employees.length} icon={HiOutlineUsers} color="blue" trend={12} />
        <DashboardCard title="Total Managers" value={managers.length} icon={HiOutlineUsers} color="green" trend={5} />
        <DashboardCard title="Total Projects" value={projects.length} icon={HiOutlineFolder} color="yellow" trend={8} />
        <DashboardCard title="Task Completion" value="72%" icon={HiOutlineCheckCircle} color="primary" trend={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartComponent data={weeklyData} dataKey="tasks" xKey="day" title="Weekly Productivity (Tasks Completed)" color="#6366f1" />
        <LineChartComponent
          data={monthlyData}
          xKey="month"
          title="Monthly Performance"
          lines={[
            { dataKey: 'completed', name: 'Completed', color: '#10b981' },
            { dataKey: 'assigned', name: 'Assigned', color: '#6366f1' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent data={taskStatusData} title="Task Status Distribution" />
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Project Progress Overview</h3>
          {projects.map((p, i) => {
            const colors = ['primary', 'green', 'yellow', 'blue', 'red'];
            return <ProjectProgressBar key={p._id || p.id} name={p.name} progress={p.progress || 0} color={colors[i % colors.length]} />;
          })}
        </div>
      </div>
    </div>
  );
}