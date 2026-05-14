import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import ChartComponent from '../../components/Common/ChartComponent';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import './ProductivityReport.css';

const ProductivityReport = () => {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await API.get('/reports/weekly-productivity', {
        params: { startDate, endDate },
      });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load productivity report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  const users = data?.users || [];
  const totals = data?.totals || {};

  const tasksChart = users.map((u) => ({
    name: u.name?.split(' ')[0],
    completed: u.tasksCompleted,
  }));

  const hoursChart = users.map((u) => ({
    name: u.name?.split(' ')[0],
    hours: u.totalHours,
  }));

  const columns = [
    { header: 'User', render: (row) => <strong>{row.name}</strong> },
    { header: 'Tasks Completed', accessor: 'tasksCompleted' },
    { header: 'Attendance Days', accessor: 'attendanceDays' },
    { header: 'Total Hours', render: (row) => <strong>{row.totalHours}</strong> },
  ];

  return (
    <div className="productivity-page">
      <h2>Weekly Productivity Summary</h2>

      <div className="filters">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="btn-primary" onClick={handleFilter}>Apply</button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>{totals.tasksCompleted || 0}</h3>
          <p>Total Tasks Completed</p>
        </div>
        <div className="summary-card">
          <h3>{totals.attendanceDays || 0}</h3>
          <p>Attendance Days</p>
        </div>
        <div className="summary-card">
          <h3>{totals.totalHours || 0}</h3>
          <p>Total Hours</p>
        </div>
      </div>

      <div className="charts">
        <ChartComponent type="bar" title="Tasks Completed" data={tasksChart} dataKey="completed" xKey="name" />
        <ChartComponent type="line" title="Hours Logged" data={hoursChart} dataKey="hours" xKey="name" />
      </div>

      <DataTable title="User Productivity" columns={columns} data={users} searchable />
    </div>
  );
};

export default ProductivityReport;