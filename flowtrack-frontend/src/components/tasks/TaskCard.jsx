import PriorityBadge from '../common/PriorityBadge';
import StatusBadge from '../common/StatusBadge';
import DeadlineCountdown from './DeadlineCountdown';
import { getInitials } from '../../utils/helpers';

export default function TaskCard({ task, onClick, provided }) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onClick && onClick(task)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <DeadlineCountdown deadline={task.deadline} />

        {task.assigneeName && (
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex-shrink-0"
            title={task.assigneeName}
          >
            {getInitials(task.assigneeName)}
          </span>
        )}
      </div>
    </div>
  );
}
