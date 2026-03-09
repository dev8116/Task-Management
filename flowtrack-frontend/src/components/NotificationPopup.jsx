import { HiOutlineX } from 'react-icons/hi';

const notifications = [
  { id: 1, text: 'New task assigned: Design Login UI', time: '5 min ago', read: false },
  { id: 2, text: 'Leave request approved', time: '1 hour ago', read: false },
  { id: 3, text: 'Project deadline approaching', time: '3 hours ago', read: true },
  { id: 4, text: 'Team meeting at 3:00 PM', time: '5 hours ago', read: true },
];

export default function NotificationPopup({ onClose }) {
  return (
    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <HiOutlineX size={16} />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.map((n) => (
          <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
            <p className="text-sm text-gray-700 dark:text-gray-300">{n.text}</p>
            <p className="text-xs text-gray-400 mt-1">{n.time}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 text-center">
        <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All</button>
      </div>
    </div>
  );
}