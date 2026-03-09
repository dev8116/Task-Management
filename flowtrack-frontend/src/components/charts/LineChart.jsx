import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LineChartComponent({ data, lines = [], xKey = 'name', title }) {
  const defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <ReLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
          {lines.map((line, i) => (
            <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} stroke={line.color || defaultColors[i]} strokeWidth={2} dot={{ r: 4 }} name={line.name || line.dataKey} />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}