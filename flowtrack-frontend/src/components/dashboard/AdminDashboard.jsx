import { useMemo } from 'react';
import {
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import StatsCard from './StatsCard';
import WelcomeBanner from './WelcomeBanner';

function readAdminStats() {
  const users = JSON.parse(localStorage.getItem('flowtrack_users') || '[]');
  const managers = users.filter((u) => u.role === 'manager').length;
  const employees = users.filter((u) => u.role === 'employee').length;
  const tasks = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const projects = JSON.parse(localStorage.getItem('flowtrack_projects') || '[]');

  return {
    totalEmployees: employees,
    totalManagers: managers,
    totalProjects: projects.length,
    completionRate,
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const stats = useMemo(readAdminStats, []);

  const cards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: HiOutlineUsers,
      color: 'blue',
      trend: null,
      subtitle: 'Active members',
    },
    {
      title: 'Total Managers',
      value: stats.totalManagers,
      icon: HiOutlineUsers,
      color: 'purple',
      trend: null,
      subtitle: 'Team leads',
    },
    {
      title: 'Projects',
      value: stats.totalProjects,
      icon: HiOutlineFolder,
      color: 'indigo',
      trend: null,
      subtitle: 'Ongoing & completed',
    },
    {
      title: 'Task Completion Rate',
      value: `${stats.completionRate}%`,
      icon: HiOutlineCheckCircle,
      color: 'green',
      trend: null,
      subtitle: 'Overall progress',
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner user={user} />

      <div className="flex items-center gap-3">
        <HiOutlineChartBar className="text-xl text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Overview</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
