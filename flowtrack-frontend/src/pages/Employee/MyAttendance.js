import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import { FiLogIn, FiLogOut } from 'react-icons/fi';
import './MyAttendance.css';

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attRes, todayRes] = await Promise.all([
        API.get('/attendance'),
        API.get('/attendance/today'),
      ]);
      setAttendance(attRes.data);
      setTodayStatus(todayRes.data);
    } catch (err) {
      toast.error('Failed to fetch attendance');
    }
  };

  const handleCheckIn = async () => {
    try {
      await API.post('/attendance/check-in');
      toast.success('Checked in successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await API.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString() : '--';
  const hasCheckedIn = todayStatus?.checkIn;
  const hasCheckedOut = todayStatus?.checkOut;

  const columns = [
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
      <div className="page-header"><h2>My Attendance</h2></div>

      {/* Today's Status */}
      <div className="today-status">
        <div className="today-status-item">
          <div className="label">Today's Date</div>
          <div className="value">{new Date().toLocaleDateString()}</div>
        </div>
        <div className="today-status-item">
          <div className="label">Check In</div>
          <div className="value">{hasCheckedIn ? formatTime(todayStatus.checkIn) : 'Not yet'}</div>
        </div>
        <div className="today-status-item">
          <div className="label">Check Out</div>
          <div className="value">{hasCheckedOut ? formatTime(todayStatus.checkOut) : 'Not yet'}</div>
        </div>
        <div className="today-status-item">
          <div className="label">Status</div>
          <div className="value">
            {hasCheckedOut ? '✅ Completed' : hasCheckedIn ? '🟢 Working' : '⏳ Not Started'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="attendance-actions">
        <button className="attendance-btn check-in" onClick={handleCheckIn} disabled={hasCheckedIn}>
          <FiLogIn /> {hasCheckedIn ? 'Already Checked In' : 'Check In'}
        </button>
        <button className="attendance-btn check-out" onClick={handleCheckOut} disabled={!hasCheckedIn || hasCheckedOut}>
          <FiLogOut /> {hasCheckedOut ? 'Already Checked Out' : 'Check Out'}
        </button>
      </div>

      {/* Attendance History */}
      <DataTable title={`Attendance History (${attendance.length})`} columns={columns} data={attendance} />
    </div>
  );
};

export default MyAttendance;