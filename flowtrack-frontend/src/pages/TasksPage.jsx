import { useState } from 'react';
import PageTransition from '../layouts/PageTransition';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskList from '../components/tasks/TaskList';

const VIEWS = [
  { id: 'kanban', label: 'Kanban View' },
  { id: 'list', label: 'List View' },
];

export default function TasksPage() {
  const [activeView, setActiveView] = useState('kanban');

  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage and track all your tasks
            </p>
          </div>

          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1 shadow-sm">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeView === view.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {activeView === 'kanban' ? <KanbanBoard /> : <TaskList />}
      </div>
    </PageTransition>
  );
}
