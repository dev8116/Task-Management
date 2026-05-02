import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';

const summarizeSelfieChecks = (row) => {
  const checks = Array.isArray(row?.selfieChecks) ? row.selfieChecks : [];
  if (!checks.length) return '—';

  const counts = checks.reduce(
    (acc, c) => {
      const s = c?.status;
      if (s === 'verified') acc.verified += 1;
      else if (s === 'failed') acc.failed += 1;
      else if (s === 'missed') acc.missed += 1;
      else if (s === 'pending') acc.pending += 1;
      return acc;
    },
    { verified: 0, failed: 0, missed: 0, pending: 0 }
  );

  return `V:${counts.verified} F:${counts.failed} M:${counts.missed} P:${counts.pending}`;
};

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAttendance = async () => {
    try {
      let url = '/attendance';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length) url += '?' + params.join('&');

      const { data } = await API.get(url);
      setAttendance(Array.isArray(data?.data) ? data.data : data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch attendance');
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const formatTime = (d) => (d ? new Date(d).toLocaleTimeString() : '--');

  const filteredAttendance = (attendance || []).filter((row) => {
    if (roleFilter === 'all') return true;
    return row.user?.role === roleFilter;
  });

  const columns = [
    { header: 'Employee', render: (row) => row.user?.name || 'N/A' },
    { header: 'Email', render: (row) => row.user?.email || 'N/A' },
    {
      header: 'Role',
      render: (row) => (
        <span className={`role-badge ${row.user?.role || ''}`}>
          {row.user?.role || 'N/A'}
        </span>
      ),
    },
    { header: 'Date', accessor: 'date' },

    // Normal attendance
    { header: 'Check In', render: (row) => formatTime(row.checkIn) },
    { header: 'Check Out', render: (row) => formatTime(row.checkOut) },
    { header: 'Total Hours', render: (row) => (row.totalHours ? `${row.totalHours}h` : '--') },

    // Overtime details
    { header: 'OT In', render: (row) => formatTime(row.overtimeCheckIn) },
    { header: 'OT Out', render: (row) => formatTime(row.overtimeCheckOut) },
    { header: 'OT Hours', render: (row) => (row.overtimeHours ? `${row.overtimeHours}h` : '--') },

    // NEW: Selfie verification summary + auto checkout reason
    { header: 'Selfie Checks', render: (row) => summarizeSelfieChecks(row) },
    { header: 'Auto Checkout Reason', render: (row) => row.autoCheckoutReason || '—' },

    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status?.toLowerCase().replace(/ /g, '-')}`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Attendance Management</h2>
      </div>

      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
        <span>to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">All Roles</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
        <button onClick={handleFilter} className="add-btn" style={{ padding: '8px 16px' }}>
          Filter
        </button>
      </div>

      <DataTable
        title={`Attendance Records (${filteredAttendance.length})`}
        columns={columns}
        data={filteredAttendance}
        rowClassName={(row) => (row.user?.role === 'manager' ? 'highlight-manager' : '')}
      />
    </div>
  );
};

export default AttendanceManagement;