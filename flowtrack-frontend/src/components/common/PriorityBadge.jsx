const colorMap = {
  Low:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Critical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function PriorityBadge({ priority }) {
  const classes = colorMap[priority] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300';

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${classes}`}>
      {priority}
    </span>
  );
}
