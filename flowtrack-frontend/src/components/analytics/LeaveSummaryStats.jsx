import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle, HiOutlineCalendar } from 'react-icons/hi';

const CARDS = [
  {
    key: 'total',
    label: 'Total Requests',
    icon: HiOutlineCalendar,
    colorClasses: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
    iconClasses: 'text-blue-500 dark:text-blue-400',
    valueClasses: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: HiOutlineCheckCircle,
    colorClasses: 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800',
    iconClasses: 'text-green-500 dark:text-green-400',
    valueClasses: 'text-green-700 dark:text-green-300',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: HiOutlineClock,
    colorClasses: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800',
    iconClasses: 'text-yellow-500 dark:text-yellow-400',
    valueClasses: 'text-yellow-700 dark:text-yellow-300',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: HiOutlineXCircle,
    colorClasses: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800',
    iconClasses: 'text-red-500 dark:text-red-400',
    valueClasses: 'text-red-700 dark:text-red-300',
  },
];

export default function LeaveSummaryStats({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, colorClasses, iconClasses, valueClasses }) => (
        <div
          key={key}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center shadow-sm ${colorClasses}`}
        >
          <Icon className={`text-3xl ${iconClasses}`} />
          <p className={`text-2xl font-bold tabular-nums ${valueClasses}`}>
            {stats[key] ?? 0}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
