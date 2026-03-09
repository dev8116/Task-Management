import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import { checkIn as apiCheckIn, checkOut as apiCheckOut, getAttendance } from '../../services/attendanceService';

export default function Attendance() {
  const { user } = useAuth();
  const [myAttendance, setMyAttendance] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const fetchAttendance = async () => {
    try {
      const res = await getAttendance(user._id || user.id);
      const records = res.data || res || [];
      setMyAttendance(records);
      const todayRecord = records.find((a) => a.date === today);
      setCheckedIn(!!(todayRecord && todayRecord.checkIn && !todayRecord.checkOut));
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  useEffect(() => { fetchAttendance(); }, [user]);

  const todayRecord = myAttendance.find((a) => a.date === today);

  const handleCheckIn = async () => {
    try {
      await apiCheckIn();
      await fetchAttendance();
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiCheckOut();
      await fetchAttendance();
    } catch (err) {
      console.error('Check-out failed:', err);
    }
  };

  const presentDays = myAttendance.filter((a) => a.status === 'Present').length;
  const totalHours = myAttendance.reduce((s, a) => s + (a.hours || 0), 0);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check In', render: (v) => v || '—' },
    { key: 'checkOut', label: 'Check Out', render: (v) => v || '—' },
    { key: 'hours', label: 'Hours', render: (v) => `${v || 0}h` },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            v === 'Present'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {v}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your daily attendance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{presentDays}</p>
          <p className="text-sm text-gray-500">Days Present</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{totalHours.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Total Hours</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">
            {myAttendance.length > 0
              ? Math.round((presentDays / myAttendance.length) * 100)
              : 100}
            %
          </p>
          <p className="text-sm text-gray-500">Attendance Rate</p>
        </div>
      </div>

      <div className="card text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Today — {today}
        </h3>
        {todayRecord?.checkOut ? (
          <div>
            <p className="text-sm text-green-600 font-medium mb-2">
              ✓ Checked in at {todayRecord.checkIn} · Checked out at{' '}
              {todayRecord.checkOut} · {todayRecord.hours}h
            </p>
            <p className="text-xs text-gray-400">You're done for today!</p>
          </div>
        ) : checkedIn || (todayRecord && !todayRecord.checkOut) ? (
          <div>
            <p className="text-sm text-blue-600 font-medium mb-3">
              ✓ Checked in at {todayRecord?.checkIn}
            </p>
            <button onClick={handleCheckOut} className="btn-danger">
              Check Out
            </button>
          </div>
        ) : (
          <button onClick={handleCheckIn} className="btn-primary">
            Check In
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Attendance History
          </h3>
        </div>
        <DataTable
          columns={columns}
          data={[...myAttendance].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )}
        />
      </div>
    </div>
  );
}
