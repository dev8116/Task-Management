import React, { useEffect, useState, useMemo } from 'react';
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

const TeamAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch team first, then attendance
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get('/users/my-team');
        setTeamMembers(Array.isArray(data?.data) ? data.data : data || []);
      } catch (err) {
        console.error('Failed to fetch team', err);
        toast.error('Failed to load team');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (loading && teamMembers.length === 0) return;
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers]);

  const fetchAttendance = async () => {
    try {
      let url = '/attendance';
      const params = [];
      if (selectedEmployee) params.push(`userId=${selectedEmployee}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length) url += '?' + params.join('&');

      const { data } = await API.get(url);
      const records = data?.data ?? data ?? [];
      setAttendance(Array.isArray(records) ? records : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => fetchAttendance();
  const formatTime = (d) => (d ? new Date(d).toLocaleTimeString() : '--');

  const columns = useMemo(
    () => [
      { header: 'Employee', render: (row) => row.user?.name || 'N/A' },
      { header: 'Department', render: (row) => row.user?.department || 'N/A' },
      { header: 'Date', accessor: 'date' },
      { header: 'Check In', render: (row) => formatTime(row.checkIn) },
      { header: 'Check Out', render: (row) => formatTime(row.checkOut) },
      { header: 'Hours', render: (row) => (row.totalHours ? `${row.totalHours}h` : '--') },

      // NEW fields
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
    ],
    []
  );

  return (
    <div>
      <div className="page-header"><h2>Team Attendance</h2></div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="">All Team Members</option>
          {teamMembers.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>

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
        <button onClick={handleFilter} className="add-btn" style={{ padding: '8px 16px' }}>
          Filter
        </button>
      </div>

      <DataTable
        title={`Team Attendance (${attendance.length})`}
        columns={columns}
        data={attendance}
        loading={loading}
      />
    </div>
  );
};

export default TeamAttendance;