import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import PriorityBadge from '../common/PriorityBadge';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function TaskDetailModal({ task, isOpen, onClose, onUpdate }) {
  const [status, setStatus] = useState(task?.status ?? 'To Do');
  const [priority, setPriority] = useState(task?.priority ?? 'Medium');

  useEffect(() => {
    if (task) {
      setStatus(task.status ?? 'To Do');
      setPriority(task.priority ?? 'Medium');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate && onUpdate(task.id, { status, priority });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {task.description}
            </p>
          )}
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Read-only details */}
        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4 space-y-3 text-sm">
          {task.deadline && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Deadline</span>
              <span className="text-gray-800 dark:text-gray-200">{formatDate(task.deadline)}</span>
            </div>
          )}
          {task.assigneeName && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Assignee</span>
              <span className="text-gray-800 dark:text-gray-200">{task.assigneeName}</span>
            </div>
          )}
          {task.createdAt && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Created</span>
              <span className="text-gray-800 dark:text-gray-200">{formatDate(task.createdAt)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Current badges</span>
            <div className="flex gap-1.5">
              <PriorityBadge priority={priority} />
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Comments placeholder */}
        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center text-sm text-gray-400 dark:text-gray-500">
          💬 Comments feature coming soon
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
