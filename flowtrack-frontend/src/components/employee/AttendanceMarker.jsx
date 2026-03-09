import { HiLogin, HiLogout } from 'react-icons/hi';

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatus(attendance) {
  if (!attendance?.checkIn) return 'Not Started';
  if (attendance.checkOut) return 'Done';
  return 'Working';
}

const statusStyles = {
  'Not Started': 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
  Working:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Done:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function AttendanceMarker({ attendance, onCheckIn, onCheckOut }) {
  const status = getStatus(attendance);
  const isCheckedIn = !!attendance?.checkIn;
  const isCheckedOut = !!attendance?.checkOut;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Date */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
          Today
        </p>
        <p className="text-base font-semibold text-gray-900 dark:text-white">{todayLabel()}</p>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
        <span className={`text-sm font-medium px-3 py-0.5 rounded-full ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      {/* Time display */}
      {isCheckedIn && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Check-In</p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {attendance.checkIn}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Check-Out</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {attendance.checkOut ?? '—'}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCheckIn}
          disabled={isCheckedIn}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-green-600 hover:bg-green-700 text-white disabled:bg-green-200 disabled:text-green-500 dark:disabled:bg-green-900/30 dark:disabled:text-green-700"
        >
          <HiLogin size={16} />
          Check In
        </button>
        <button
          onClick={onCheckOut}
          disabled={!isCheckedIn || isCheckedOut}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-red-600 hover:bg-red-700 text-white disabled:bg-red-200 disabled:text-red-500 dark:disabled:bg-red-900/30 dark:disabled:text-red-700"
        >
          <HiLogout size={16} />
          Check Out
        </button>
      </div>
    </div>
  );
}
