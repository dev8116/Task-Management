import { useState } from 'react';
import { HiSortAscending, HiSortDescending, HiStar } from 'react-icons/hi';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <HiStar
          key={i}
          className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  );
}

const COLUMNS = [
  { key: 'name', label: 'Employee' },
  { key: 'tasksCompleted', label: 'Tasks Completed' },
  { key: 'avgCompletionDays', label: 'Avg. Days / Task' },
  { key: 'rating', label: 'Rating' },
];

export default function PerformanceRankingTable({ data = [] }) {
  const [sortKey, setSortKey] = useState('tasksCompleted');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
          Performance Ranking
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                #
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition"
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <HiSortAscending className="text-blue-500" />
                      ) : (
                        <HiSortDescending className="text-blue-500" />
                      )
                    ) : (
                      <HiSortDescending className="opacity-25" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={row.name + i}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                >
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                    {row.tasksCompleted}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                    {row.avgCompletionDays}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={row.rating} />
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
