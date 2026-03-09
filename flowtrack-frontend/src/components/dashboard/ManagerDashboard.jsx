import { useMemo } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineClock,
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import StatsCard from './StatsCard';
import WelcomeBanner from './WelcomeBanner';

function readManagerStats(managerId) {
  const tasks = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
  const teamTasks = tasks.filter((t) => t.managerId === managerId || t.assignedBy === managerId);
  const pending = teamTasks.filter((t) => t.status === 'pending').length;
  const completed = teamTasks.filter((t) => t.status === 'completed').length;

  const leaves = JSON.parse(localStorage.getItem('flowtrack_leaves') || '[]');
  const pendingApprovals = leaves.filter(
    (l) => l.managerId === managerId && l.status === 'pending'
  ).length;

  const attendance = JSON.parse(localStorage.getItem('flowtrack_attendance') || '[]');
  const today = new Date().toISOString().split('T')[0];
  const presentToday = attendance.filter((a) => a.date === today && a.managerId === managerId).length;

  const upcoming = teamTasks.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false;
    const diff = (new Date(t.dueDate) - new Date()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  return { totalTasks: teamTasks.length, pendingApprovals, presentToday, upcoming, pending, completed };
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const stats = useMemo(() => readManagerStats(user?.id), [user?.id]);

  const cards = [
    {
      title: 'Team Tasks',
      value: stats.totalTasks,
      icon: HiOutlineClipboardList,
      color: 'blue',
      trend: null,
      subtitle: `${stats.pending} pending, ${stats.completed} done`,
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: HiOutlineCheckCircle,
      color: 'yellow',
      trend: null,
      subtitle: 'Leave requests',
    },
    {
      title: 'Team Attendance',
      value: stats.presentToday,
      icon: HiOutlineUserGroup,
      color: 'green',
      trend: null,
      subtitle: 'Present today',
    },
    {
      title: 'Upcoming Deadlines',
      value: stats.upcoming,
      icon: HiOutlineClock,
      color: 'red',
      trend: null,
      subtitle: 'Due within 7 days',
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner user={user} />

      <div className="flex items-center gap-3">
        <HiOutlineClipboardList className="text-xl text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Team Overview</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
