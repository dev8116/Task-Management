import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import ChartComponent from '../../components/Common/ChartComponent';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Reports.css';

const Reports = () => {
  const [projectReport,     setProjectReport]     = useState([]);
  const [performanceReport, setPerformanceReport] = useState([]);
  const [taskSummary,       setTaskSummary]       = useState({});
  const [loading,           setLoading]           = useState(true);

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

      // Handle both plain array and { data: [...] } response shapes
      const proj = projRes.data?.data ?? projRes.data;
      const perf = perfRes.data?.data ?? perfRes.data;

      setProjectReport(Array.isArray(proj) ? proj : []);
      setPerformanceReport(Array.isArray(perf) ? perf : []);
      setTaskSummary(taskRes.data || {});
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // ── PDF Export helper ────────────────────────────────────────
  const exportToPDF = (title, columns, data) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
      day: '2-digit', month: 'long', year: 'numeric',
    })}`, 14, 30);
    doc.autoTable({
      startY: 36,
      head: [columns],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { fontSize: 10 },
    });
    doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };

  const exportProjectPDF = () => {
    exportToPDF(
      'Project Progress Report',
      ['Project', 'Manager', 'Status', 'Progress', 'Total Tasks', 'Completed'],
      projectReport.map((p) => [
        p.name,
        p.manager,
        p.status,
        // ✅ shows calculated progress (e.g. 50% when 2/4 done)
        `${p.progress}% (${p.completedTasks}/${p.totalTasks})`,
        p.totalTasks,
        p.completedTasks,
      ])
    );
  };

  const exportPerformancePDF = () => {
    exportToPDF(
      'Employee Performance Report',
      ['Name', 'Department', 'Total Tasks', 'Completed', 'Overdue', 'Completion Rate'],
      performanceReport.map((e) => [
        e.name,
        e.department || 'N/A',
        e.totalTasks,
        e.completedTasks,
        e.overdueTasks,
        `${e.completionRate}%`,
      ])
    );
  };

  // ── Project Progress colour helper ───────────────────────────
  const getProgressColor = (pct) => {
    if (pct >= 80) return '#2e7d32';   // green
    if (pct >= 50) return '#ef6c00';   // orange
    return '#c62828';                   // red
  };

  // ── Table column definitions ─────────────────────────────────
  const projectColumns = [
    {
      header: 'Project',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '14px' }}>{row.name}</strong>
        </div>
      ),
    },
    {
      header: 'Manager',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#334155' }}>{row.manager || 'N/A'}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`status-badge ${(row.status || '').toLowerCase().replace(/ /g, '-')}`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {row.status || '—'}
        </span>
      ),
    },
    {
      header: 'Progress',
      render: (row) => {
        // ✅ row.progress is now CALCULATED from real task counts (backend fixed)
        const pct   = row.progress ?? 0;
        const color = getProgressColor(pct);
        return (
          <div style={{ minWidth: '160px' }}>
            {/* Progress bar */}
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            {/* Label row: percentage + fraction */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span className="progress-text" style={{ color, fontWeight: 600 }}>
                {pct}%
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {row.completedTasks}/{row.totalTasks} tasks
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Total Tasks',
      render: (row) => (
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.totalTasks}</span>
      ),
    },
    {
      header: 'Completed',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#2e7d32', fontSize: '14px' }}>
          {row.completedTasks}
        </span>
      ),
    },
    {
      header: 'Dates',
      render: (row) => (
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          {row.startDate ? (
            <>
              <div>Start: {new Date(row.startDate).toLocaleDateString()}</div>
              {row.endDate && (
                <div>End: {new Date(row.endDate).toLocaleDateString()}</div>
              )}
            </>
          ) : (
            '—'
          )}
        </div>
      ),
    },
  ];

  const performanceColumns = [
    {
      header: 'Employee',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '14px' }}>{row.name}</strong>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {row.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      render: (row) => (
        <span style={{ fontSize: '13px' }}>{row.department || 'No Department'}</span>
      ),
    },
    {
      header: 'Total Tasks',
      render: (row) => (
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.totalTasks}</span>
      ),
    },
    {
      header: 'Completed',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#2e7d32', fontSize: '14px' }}>
          {row.completedTasks}
        </span>
      ),
    },
    {
      header: 'Overdue',
      render: (row) => (
        <span style={{
          fontWeight: 600, fontSize: '14px',
          color: row.overdueTasks > 0 ? '#c62828' : '#2e7d32',
        }}>
          {row.overdueTasks}
        </span>
      ),
    },
    {
      header: 'Completion Rate',
      render: (row) => {
        const color = row.completionRate >= 70
          ? '#2e7d32'
          : row.completionRate >= 40
          ? '#ef6c00'
          : '#c62828';
        return (
          <div style={{ minWidth: '110px' }}>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${row.completionRate}%`, background: color }}
              />
            </div>
            <strong style={{ color, fontSize: '13px' }}>{row.completionRate}%</strong>
          </div>
        );
      },
    },
    {
      header: 'Attendance Days',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#334155' }}>
          {row.totalAttendance ?? 0} days
        </span>
      ),
    },
  ];

  // ── Chart data ── use lowercase keys returned by fixed backend
  const taskPieData = [
    { name: 'Pending',          value: taskSummary.pending          || 0 },
    { name: 'In Progress',      value: taskSummary.inProgress       || 0 },
    { name: 'Pending Approval', value: taskSummary.pendingApproval  || 0 },
    { name: 'Completed',        value: taskSummary.completed        || 0 },
    { name: 'Overdue',          value: taskSummary.overdue          || 0 },
  ].filter((d) => d.value > 0); // hide slices with 0 value

  // ── Summary stat pills for quick overview ────────────────────
  const totalProjectTasks     = projectReport.reduce((s, p) => s + (p.totalTasks     || 0), 0);
  const totalCompletedProjTasks = projectReport.reduce((s, p) => s + (p.completedTasks || 0), 0);
  const overallProgress = totalProjectTasks > 0
    ? Math.round((totalCompletedProjTasks / totalProjectTasks) * 100)
    : 0;

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading reports...
      </div>
    );
  }

  return (
    <div className="reports-page">
      <h2>Reports &amp; Analytics</h2>

      {/* ── Summary Pills ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Total Projects',    value: projectReport.length,          color: '#1a237e' },
          { label: 'Total Tasks',       value: totalProjectTasks,              color: '#ef6c00' },
          { label: 'Completed Tasks',   value: totalCompletedProjTasks,        color: '#2e7d32' },
          { label: 'Overall Progress',  value: `${overallProgress}%`,          color: '#0284c7' },
          { label: 'Pending',           value: taskSummary.pending      || 0,  color: '#f59e0b' },
          { label: 'In Progress',       value: taskSummary.inProgress   || 0,  color: '#6366f1' },
          { label: 'Overdue',           value: taskSummary.overdue      || 0,  color: '#c62828' },
        ].map((pill) => (
          <div key={pill.label} style={{
            background: '#fff', borderRadius: '10px', padding: '12px 20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            borderLeft: `4px solid ${pill.color}`,
            minWidth: '120px',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: pill.color }}>
              {pill.value}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {pill.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Task Summary Pie Chart ── */}
      <div className="report-section">
        <ChartComponent
          type="pie"
          data={taskPieData}
          title="Task Status Distribution"
          dataKey="value"
          xKey="name"
        />
      </div>

      {/* ── Project Progress Table ── */}
      <div className="report-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Project Progress</h3>
          <button className="export-btn" onClick={exportProjectPDF}>
            Export PDF
          </button>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: 'auto' }}>
            Progress is calculated from real task counts
          </span>
        </div>

        {projectReport.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No projects found.
          </div>
        ) : (
          <DataTable
            title=""
            columns={projectColumns}
            data={projectReport}
            searchable={false}
          />
        )}
      </div>

      {/* ── Employee Leaderboard ── */}
      <div className="report-section">
        <h3>Employee Leaderboard</h3>
        {performanceReport.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No employee data available.</p>
        ) : (
          <div className="leaderboard">
            {performanceReport.slice(0, 6).map((emp, idx) => (
              <div key={emp._id} className="leaderboard-card">
                <div className={`leaderboard-rank ${
                  idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''
                }`}>
                  #{idx + 1}
                </div>
                <div className="leaderboard-info">
                  <h4>{emp.name}</h4>
                  <p>{emp.department || 'No Department'}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {emp.completedTasks}/{emp.totalTasks} tasks completed
                  </p>
                </div>
                <div className="leaderboard-stat">
                  <div className="rate" style={{
                    color: emp.completionRate >= 70
                      ? '#2e7d32'
                      : emp.completionRate >= 40
                      ? '#ef6c00'
                      : '#c62828',
                  }}>
                    {emp.completionRate}%
                  </div>
                  <div className="label">Completion</div>
                  {emp.overdueTasks > 0 && (
                    <div style={{ fontSize: '11px', color: '#c62828', marginTop: '4px' }}>
                      ⚠ {emp.overdueTasks} overdue
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Employee Performance Table ── */}
      <div className="report-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Employee Performance</h3>
          <button className="export-btn" onClick={exportPerformancePDF}>
            Export PDF
          </button>
        </div>
        {performanceReport.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No performance data available.
          </div>
        ) : (
          <DataTable
            title=""
            columns={performanceColumns}
            data={performanceReport}
            searchable={false}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;