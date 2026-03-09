import { HiCheckCircle, HiUsers, HiCalendar, HiClipboardList } from 'react-icons/hi';
import { formatDate, getInitials } from '../../utils/helpers';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function WeeklyReport({ weekData = {} }) {
  const {
    tasksCompleted = 0,
    attendancePercent = 0,
    topPerformers = [],
    startDate,
    endDate,
  } = weekData;

  const dateRange =
    startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : 'This week';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Summary</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <HiCalendar size={14} />
          {dateRange}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
            <HiCheckCircle size={22} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{tasksCompleted}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <HiUsers size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {attendancePercent}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Attendance bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Attendance</span>
          <span>{attendancePercent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, attendancePercent)}%` }}
          />
        </div>
      </div>

      {/* Top performers */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <HiClipboardList size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Top Performers</p>
        </div>

        {topPerformers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No data available</p>
        ) : (
          <ol className="space-y-2">
            {topPerformers.slice(0, 3).map((performer, i) => (
              <li
                key={performer.id ?? i}
                className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2"
              >
                <span className="text-lg">{MEDAL[i] ?? ''}</span>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex-shrink-0">
                  {getInitials(performer.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {performer.name}
                  </p>
                  {performer.score != null && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Score: {performer.score}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
