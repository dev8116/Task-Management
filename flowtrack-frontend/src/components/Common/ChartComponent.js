import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import "./ChartComponent.css";

const COLORS = {
  Completed: '#4caf50',         // 🟢 Green (success)
  Pending: '#ff9800',           // 🟠 Orange (waiting)
  "In Progress": '#2196f3',     // 🔵 Blue (active work)
  "Pending Approval": '#9c27b0',// 🟣 Purple (review stage)
  Overdue: '#e53935',           // 🔴 Red (urgent/problem)
  default: '#9e9e9e'            // ⚪ Gray (fallback)
};
const ChartComponent = ({
  type = "bar",
  data,
  title,
  dataKey,
  xKey,
  colors,
}) => {
  return (
    <div className="chart-container">
      {title && <h3>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        {type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey || "name"} />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey={dataKey || "value"}
              fill="#1a237e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : type === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey || "value"}
              nameKey={xKey || "name"}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[entry[xKey || "name"]] || COLORS.default}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey || "name"} />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={dataKey || "value"}
              stroke="#1a237e"
              strokeWidth={2}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;
