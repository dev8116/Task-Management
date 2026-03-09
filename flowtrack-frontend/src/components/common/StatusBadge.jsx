const colorMap = {
  'To Do':       'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In-Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In Review':   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Done':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Completed':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Pending':     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Overdue':     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function StatusBadge({ status }) {
  const classes = colorMap[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${classes}`}>
      {status}
    </span>
  );
}
