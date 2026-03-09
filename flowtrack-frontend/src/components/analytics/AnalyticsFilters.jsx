import { useState } from 'react';
import { HiOutlineSearch, HiOutlineRefresh, HiOutlineFilter } from 'react-icons/hi';
import { DEPARTMENTS } from '../../utils/constants';

export default function AnalyticsFilters({ filters = {}, onChange, onApply, onReset }) {
  const [local, setLocal] = useState({
    startDate: filters.startDate ?? '',
    endDate: filters.endDate ?? '',
    department: filters.department ?? 'All Departments',
    employee: filters.employee ?? '',
  });

  const update = (key, value) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onChange?.(next);
  };

  const handleApply = () => {
    onApply?.(local);
  };

  const handleReset = () => {
    const empty = { startDate: '', endDate: '', department: 'All Departments', employee: '' };
    setLocal(empty);
    onChange?.(empty);
    onReset?.();
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="mb-3 flex items-center gap-2">
        <HiOutlineFilter className="text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filters</h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Start date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Start Date
          </label>
          <input
            type="date"
            value={local.startDate}
            max={local.endDate || undefined}
            onChange={(e) => update('startDate', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* End date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            End Date
          </label>
          <input
            type="date"
            value={local.endDate}
            min={local.startDate || undefined}
            onChange={(e) => update('endDate', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Department */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Department
          </label>
          <select
            value={local.department}
            onChange={(e) => update('department', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Employee search */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Employee
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
              <HiOutlineSearch className="text-base" />
            </span>
            <input
              type="text"
              value={local.employee}
              onChange={(e) => update('employee', e.target.value)}
              placeholder="Search employee…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-9 pr-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <HiOutlineRefresh className="text-base" />
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <HiOutlineFilter className="text-base" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
