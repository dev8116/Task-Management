import { useState, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { HiPlus } from 'react-icons/hi';
import KanbanColumn from './KanbanColumn';
import TaskForm from './TaskForm';
import TaskDetailModal from './TaskDetailModal';
import { generateId } from '../../utils/helpers';

const COLUMNS = [
  { id: 'todo',       title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'inreview',   title: 'In Review' },
  { id: 'done',       title: 'Done' },
];

const STATUS_MAP = {
  todo:       'To Do',
  inprogress: 'In Progress',
  inreview:   'In Review',
  done:       'Done',
};

const COLUMN_ID_FROM_STATUS = {
  'To Do':       'todo',
  'In Progress': 'inprogress',
  'In Review':   'inreview',
  'Done':        'done',
};

function loadTasks() {
  try {
    const stored = localStorage.getItem('kanban_tasks');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
}

export default function KanbanBoard({ users = [], projects = [] }) {
  const [tasks, setTasks] = useState(loadTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialStatus, setFormInitialStatus] = useState('todo');
  const [selectedTask, setSelectedTask] = useState(null);

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(
      (t) => (COLUMN_ID_FROM_STATUS[t.status] ?? 'todo') === col.id
    );
    return acc;
  }, {});

  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = STATUS_MAP[destination.droppableId] ?? 'To Do';

    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      );
      // Reorder within column
      const colTasks = updated.filter(
        (t) => (COLUMN_ID_FROM_STATUS[t.status] ?? 'todo') === destination.droppableId
      );
      const otherTasks = updated.filter(
        (t) => (COLUMN_ID_FROM_STATUS[t.status] ?? 'todo') !== destination.droppableId
      );
      const movedTask = colTasks.find((t) => t.id === draggableId);
      const rest = colTasks.filter((t) => t.id !== draggableId);
      rest.splice(destination.index, 0, movedTask);
      const result = [...otherTasks, ...rest];
      saveTasks(result);
      return result;
    });
  }, []);

  const handleAddTask = useCallback((columnId) => {
    setFormInitialStatus(columnId);
    setIsFormOpen(true);
  }, []);

  const handleTaskSubmit = useCallback((formData) => {
    const newTask = {
      id: generateId(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const updated = [...prev, newTask];
      saveTasks(updated);
      return updated;
    });
    setIsFormOpen(false);
  }, []);

  const handleTaskUpdate = useCallback((taskId, updatedData) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t));
      saveTasks(updated);
      return updated;
    });
    setSelectedTask(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kanban Board</h2>
        <button
          onClick={() => { setFormInitialStatus('todo'); setIsFormOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <HiPlus size={16} />
          Add Task
        </button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] ?? []}
              onTaskClick={setSelectedTask}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleTaskSubmit}
        initialData={{ status: STATUS_MAP[formInitialStatus] ?? 'To Do' }}
        users={users}
        projects={projects}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}
