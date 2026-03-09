import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineFolder, HiOutlineChartBar,
  HiOutlineClipboardList, HiOutlineClock, HiOutlineCalendar, HiOutlineCheckCircle,
  HiOutlineDocumentText, HiOutlineX, HiOutlineStar,
} from 'react-icons/hi';

const navItems = {
  admin: [
    { to: '/admin', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: HiOutlineUsers, label: 'User Management' },
    { to: '/admin/projects', icon: HiOutlineFolder, label: 'Projects' },
    { to: '/admin/reports', icon: HiOutlineChartBar, label: 'Reports & Analytics' },
    { to: '/admin/attendance', icon: HiOutlineClock, label: 'Attendance & Leaves' },
    { to: '/admin/activity', icon: HiOutlineDocumentText, label: 'Activity Logs' },
  ],
  manager: [
    { to: '/manager', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/manager/projects', icon: HiOutlineFolder, label: 'Projects' },
    { to: '/manager/tasks', icon: HiOutlineClipboardList, label: 'Task Management' },
    { to: '/manager/performance', icon: HiOutlineStar, label: 'Team Performance' },
    { to: '/manager/attendance', icon: HiOutlineClock, label: 'Attendance' },
    { to: '/manager/leaves', icon: HiOutlineCalendar, label: 'Leave Approval' },
  ],
  employee: [
    { to: '/employee', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/employee/tasks', icon: HiOutlineCheckCircle, label: 'My Tasks' },
    { to: '/employee/attendance', icon: HiOutlineClock, label: 'Attendance' },
    { to: '/employee/leaves', icon: HiOutlineCalendar, label: 'Leave Request' },
    { to: '/employee/performance', icon: HiOutlineChartBar, label: 'Performance' },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = navItems[user?.role] || [];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          backdrop-blur-md bg-white/80 dark:bg-gray-900/80
          border-r border-white/30 dark:border-gray-700/50
          shadow-xl
          transform transition-transform duration-300
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/30 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">FlowTrack</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
            aria-label="Close sidebar"
          >
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            {user?.role} Panel
          </span>
        </div>

        {/* Navigation */}
        <nav
          className="px-3 space-y-1 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 130px)' }}
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50/80 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
