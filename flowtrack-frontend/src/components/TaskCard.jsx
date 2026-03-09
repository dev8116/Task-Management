import { getPriorityClass, getStatusClass } from '../utils/helpers';

export default function TaskCard({ task, onStatusChange }) {
  const statuses = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="card hover:border-primary-300 dark:hover:border-primary-700">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{task.title}</h3>
        <span className={getPriorityClass(task.priority)}>{task.priority}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between">
        <span className={getStatusClass(task.status)}>{task.status}</span>
        {onStatusChange && (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded px-2 py-1 outline-none"
          >
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {task.deadline && (
        <p className="text-xs text-gray-400 mt-2">Due: {task.deadline}</p>
      )}
    </div>
  );
}