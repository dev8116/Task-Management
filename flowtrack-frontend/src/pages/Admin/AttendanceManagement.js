import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      let url = '/attendance';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length) url += '?' + params.join('&');
      const { data } = await API.get(url);
      setAttendance(data);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString() : '--';

  const filteredAttendance = attendance.filter((row) => {
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
    { header: 'Check In', render: (row) => formatTime(row.checkIn) },
    { header: 'Check Out', render: (row) => formatTime(row.checkOut) },
    { header: 'Total Hours', render: (row) => row.totalHours ? `${row.totalHours}h` : '--' },
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

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }} />
        <span>to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }} />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">All Roles</option>
          {/* <option value="admin">Admin</option> */}
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
        <button onClick={handleFilter} className="add-btn" style={{ padding: '8px 16px' }}>Filter</button>
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