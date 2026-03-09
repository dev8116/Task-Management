import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { HiPlus } from 'react-icons/hi';

const columnHeaderColors = {
  'todo':        'bg-gray-400',
  'inprogress':  'bg-blue-500',
  'inreview':    'bg-yellow-500',
  'done':        'bg-green-500',
};

export default function KanbanColumn({ column, tasks, onTaskClick, onAddTask }) {
  const colorKey = column.id.replace(/-/g, '').toLowerCase();
  const barColor = columnHeaderColors[colorKey] ?? 'bg-indigo-500';

  return (
    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3 min-h-96 w-72 flex-shrink-0 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {column.title}
          </h3>
        </div>
        <span className="text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full shadow-sm">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 flex-1 rounded-lg transition-colors min-h-16 ${
              snapshot.isDraggingOver
                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <TaskCard
                    task={task}
                    onClick={onTaskClick}
                    provided={provided}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task button */}
      <button
        onClick={() => onAddTask && onAddTask(column.id)}
        className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border border-dashed border-gray-300 dark:border-gray-600"
      >
        <HiPlus size={14} />
        Add Task
      </button>
    </div>
  );
}
