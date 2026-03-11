import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import './ChartComponent.css';

const COLORS = ['#1a237e', '#4caf50', '#ff9800', '#e53935', '#9c27b0', '#00bcd4'];

const ChartComponent = ({ type = 'bar', data, title, dataKey, xKey, colors }) => {
  const chartColors = colors || COLORS;

  return (
    <div className="chart-container">
      {title && <h3>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey || 'name'} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey || 'value'} fill="#1a237e" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey={dataKey || 'value'} nameKey={xKey || 'name'} cx="50%" cy="50%"
              outerRadius={100} label>
              {data.map((entry, index) => (
                <Cell key={index} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey || 'name'} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey || 'value'} stroke="#1a237e" strokeWidth={2} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;