import { useState } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AssignTask({ tasks = [], employees = [], onAssign }) {
  const [taskId, setTaskId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');

  const toggleEmployee = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskId) { setError('Please select a task.'); return; }
    if (!selectedIds.length) { setError('Please select at least one team member.'); return; }
    setError('');
    onAssign && onAssign({ taskId, assigneeIds: selectedIds, deadline, priority });
    setTaskId('');
    setSelectedIds([]);
    setDeadline('');
    setPriority('Medium');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Assign Task</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Task select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task
          </label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Select task —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Team members */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Members</p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
            {employees.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No employees available</p>
            ) : (
              employees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.name}</p>
                    {emp.role && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{emp.role}</p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedIds.length > 0 && (
            <p className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400">
              {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Assign Task
        </button>
      </form>
    </div>
  );
}
