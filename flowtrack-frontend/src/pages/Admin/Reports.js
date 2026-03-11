import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import ChartComponent from '../../components/Common/ChartComponent';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Reports.css';

const Reports = () => {
  const [projectReport, setProjectReport] = useState([]);
  const [performanceReport, setPerformanceReport] = useState([]);
  const [taskSummary, setTaskSummary] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [projRes, perfRes, taskRes] = await Promise.all([
        API.get('/reports/projects'),
        API.get('/reports/performance'),
        API.get('/reports/tasks-summary'),
      ]);
      setProjectReport(projRes.data);
      setPerformanceReport(perfRes.data);
      setTaskSummary(taskRes.data);
    } catch (err) {
      toast.error('Failed to fetch reports');
    }
  };

  const exportToPDF = (title, columns, data) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      startY: 35,
      head: [columns],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [26, 35, 126] },
    });
    doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };

  const exportProjectPDF = () => {
    exportToPDF(
      'Project Progress Report',
      ['Project', 'Manager', 'Status', 'Progress', 'Tasks', 'Completed'],
      projectReport.map((p) => [p.name, p.manager, p.status, `${p.progress}%`, p.totalTasks, p.completedTasks])
    );
  };

  const exportPerformancePDF = () => {
    exportToPDF(
      'Employee Performance Report',
      ['Name', 'Department', 'Total Tasks', 'Completed', 'Overdue', 'Rate'],
      performanceReport.map((e) => [e.name, e.department, e.totalTasks, e.completedTasks, e.overdueTasks, `${e.completionRate}%`])
    );
  };

  const projectColumns = [
    { header: 'Project', accessor: 'name' },
    { header: 'Manager', accessor: 'manager' },
    { header: 'Status', render: (row) => <span className={`status-badge ${row.status?.toLowerCase().replace(/ /g, '-')}`}>{row.status}</span> },
    {
      header: 'Progress',
      render: (row) => (
        <div>
          <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${row.progress}%` }} /></div>
          <span className="progress-text">{row.progress}%</span>
        </div>
      ),
    },
    { header: 'Tasks', accessor: 'totalTasks' },
    { header: 'Completed', accessor: 'completedTasks' },
  ];

  const performanceColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Total Tasks', accessor: 'totalTasks' },
    { header: 'Completed', accessor: 'completedTasks' },
    { header: 'Overdue', render: (row) => <span style={{ color: row.overdueTasks > 0 ? '#c62828' : '#2e7d32' }}>{row.overdueTasks}</span> },
    { header: 'Completion Rate', render: (row) => <strong style={{ color: row.completionRate >= 70 ? '#2e7d32' : '#ef6c00' }}>{row.completionRate}%</strong> },
    { header: 'Attendance Days', accessor: 'totalAttendance' },
  ];

  const taskPieData = [
    { name: 'Pending', value: taskSummary.pending || 0 },
    { name: 'In Progress', value: taskSummary.inProgress || 0 },
    { name: 'Completed', value: taskSummary.completed || 0 },
    { name: 'Overdue', value: taskSummary.overdue || 0 },
  ];

  return (
    <div className="reports-page">
      <h2>Reports & Analytics</h2>

      {/* Task Summary Chart */}
      <div className="report-section">
        <ChartComponent type="pie" data={taskPieData} title="Task Completion Summary" dataKey="value" xKey="name" />
      </div>

      {/* Project Progress */}
      <div className="report-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Project Progress</h3>
          <button className="export-btn" onClick={exportProjectPDF}>Export PDF</button>
        </div>
        <DataTable title="" columns={projectColumns} data={projectReport} searchable={false} />
      </div>

      {/* Employee Leaderboard */}
      <div className="report-section">
        <h3>Employee Leaderboard</h3>
        <div className="leaderboard">
          {performanceReport.slice(0, 6).map((emp, idx) => (
            <div key={emp._id} className="leaderboard-card">
              <div className={`leaderboard-rank ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>
                #{idx + 1}
              </div>
              <div className="leaderboard-info">
                <h4>{emp.name}</h4>
                <p>{emp.department || 'No Department'}</p>
              </div>
              <div className="leaderboard-stat">
                <div className="rate">{emp.completionRate}%</div>
                <div className="label">Completion</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="report-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Employee Performance</h3>
          <button className="export-btn" onClick={exportPerformancePDF}>Export PDF</button>
        </div>
        <DataTable title="" columns={performanceColumns} data={performanceReport} searchable={false} />
      </div>
    </div>
  );
};

export default Reports;