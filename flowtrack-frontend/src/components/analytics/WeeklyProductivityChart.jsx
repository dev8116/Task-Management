import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function WeeklyProductivityChart({ data = [] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <h3 className="mb-4 text-base font-semibold text-gray-700 dark:text-gray-200">
        Weekly Productivity
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeOpacity={0.5} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-gray-500 dark:text-gray-400"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-gray-500 dark:text-gray-400"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tw-bg, #1f2937)',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="tasks"
            name="Tasks Completed"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorTasks)"
            dot={{ r: 3, fill: '#6366f1' }}
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="hours"
            name="Hours Worked"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#colorHours)"
            dot={{ r: 3, fill: '#22d3ee' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
