import { useState } from 'react';
import { todayStr } from '../../utils/helpers';

export default function WorkLogForm({ tasks = [], onSubmit }) {
  const [form, setForm] = useState({
    date: todayStr(),
    taskId: '',
    hours: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.taskId) errs.taskId = 'Please select a task';
    if (form.hours === '' || isNaN(Number(form.hours))) errs.hours = 'Hours is required';
    else if (Number(form.hours) < 0 || Number(form.hours) > 24) errs.hours = 'Hours must be 0–24';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit && onSubmit({ ...form, hours: Number(form.hours) });
    setForm({ date: todayStr(), taskId: '', hours: '', description: '' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Log Work</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hours Worked
            </label>
            <input
              type="number"
              name="hours"
              value={form.hours}
              onChange={handleChange}
              min={0}
              max={24}
              step={0.5}
              placeholder="e.g. 6"
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.hours ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.hours && <p className="mt-1 text-xs text-red-500">{errors.hours}</p>}
          </div>
        </div>

        {/* Task */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task
          </label>
          <select
            name="taskId"
            value={form.taskId}
            onChange={handleChange}
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.taskId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">— Select task —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          {errors.taskId && <p className="mt-1 text-xs text-red-500">{errors.taskId}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="What did you work on?"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Submit Work Log
        </button>
      </form>
    </div>
  );
}
