import { useState, useMemo } from 'react';
import { HiSwitchVertical } from 'react-icons/hi';

export default function TimeTracker({ data = [] }) {
  const [sortByTotal, setSortByTotal] = useState(false);

  const allEmployees = useMemo(() => {
    const names = new Set();
    data.forEach((row) => row.employees?.forEach((e) => names.add(e.name)));
    return [...names];
  }, [data]);

  const rows = useMemo(() => {
    const processed = data.map((row) => {
      const totalHours = row.employees?.reduce((sum, e) => sum + (e.hours ?? 0), 0) ?? 0;
      const empMap = Object.fromEntries((row.employees ?? []).map((e) => [e.name, e.hours]));
      return { taskName: row.taskName, employees: empMap, totalHours };
    });
    return sortByTotal ? [...processed].sort((a, b) => b.totalHours - a.totalHours) : processed;
  }, [data, sortByTotal]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Time Tracker</h2>
        <button
          onClick={() => setSortByTotal((s) => !s)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            sortByTotal
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <HiSwitchVertical size={14} />
          {sortByTotal ? 'Sorted by hours' : 'Sort by hours'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Task
              </th>
              {allEmployees.map((name) => (
                <th
                  key={name}
                  className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {name}
                </th>
              ))}
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Total hrs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={allEmployees.length + 2}
                  className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  No time tracking data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {row.taskName}
                  </td>
                  {allEmployees.map((name) => (
                    <td key={name} className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                      {row.employees[name] != null ? `${row.employees[name]}h` : '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                    {row.totalHours}h
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
