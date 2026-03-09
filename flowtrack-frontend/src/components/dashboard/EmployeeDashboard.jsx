import { useMemo } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlinePaperAirplane,
  HiOutlineStar,
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import { ANNUAL_LEAVE_ALLOWANCE } from '../../utils/constants';
import StatsCard from './StatsCard';
import WelcomeBanner from './WelcomeBanner';

function readEmployeeStats(userId) {
  const tasks = JSON.parse(localStorage.getItem('flowtrack_tasks') || '[]');
  const myTasks = tasks.filter((t) => t.assigneeId === userId);
  const completed = myTasks.filter((t) => t.status === 'completed').length;
  const inProgress = myTasks.filter((t) => t.status === 'in_progress').length;
  const pending = myTasks.filter((t) => t.status === 'pending').length;

  const attendance = JSON.parse(localStorage.getItem('flowtrack_attendance') || '[]');
  const today = new Date().toISOString().split('T')[0];
  const checkedInToday = attendance.some((a) => a.userId === userId && a.date === today);

  const leaves = JSON.parse(localStorage.getItem('flowtrack_leaves') || '[]');
  const approvedLeaves = leaves.filter((l) => l.userId === userId && l.status === 'approved');
  const usedLeave = approvedLeaves.reduce((sum, l) => {
    const days = l.days ?? 1;
    return sum + days;
  }, 0);
  const leaveBalance = Math.max(0, ANNUAL_LEAVE_ALLOWANCE - usedLeave);

  const performances = JSON.parse(localStorage.getItem('flowtrack_performance') || '[]');
  const myPerf = performances.find((p) => p.userId === userId);
  const perfScore = myPerf?.score ?? (myTasks.length ? Math.round((completed / myTasks.length) * 100) : 0);

  return { totalTasks: myTasks.length, completed, inProgress, pending, checkedInToday, leaveBalance, perfScore };
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const stats = useMemo(() => readEmployeeStats(user?.id), [user?.id]);

  const cards = [
    {
      title: 'My Tasks',
      value: stats.totalTasks,
      icon: HiOutlineClipboardList,
      color: 'blue',
      trend: null,
      subtitle: `${stats.completed} done · ${stats.inProgress} in progress`,
    },
    {
      title: "Today's Attendance",
      value: stats.checkedInToday ? 'Present' : 'Not checked in',
      icon: HiOutlineCalendar,
      color: stats.checkedInToday ? 'green' : 'yellow',
      trend: null,
      subtitle: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    },
    {
      title: 'Leave Balance',
      value: `${stats.leaveBalance} days`,
      icon: HiOutlinePaperAirplane,
      color: 'purple',
      trend: null,
      subtitle: 'Remaining this year',
    },
    {
      title: 'Performance Score',
      value: `${stats.perfScore}%`,
      icon: HiOutlineStar,
      color: stats.perfScore >= 75 ? 'green' : stats.perfScore >= 50 ? 'yellow' : 'red',
      trend: null,
      subtitle: 'Based on task completion',
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner user={user} />

      <div className="flex items-center gap-3">
        <HiOutlineClipboardList className="text-xl text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">My Overview</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
