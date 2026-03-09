import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import SearchFilter from '../../components/SearchFilter';
import { getInitials } from '../../utils/helpers';
import { getAllUsers } from '../../services/userService';
import { getAttendanceByDate } from '../../services/attendanceService';

export default function AttendanceMonitoring() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [myTeam, setMyTeam] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await getAllUsers();
        const allUsers = usersRes.data || usersRes || [];
        const team = allUsers.filter((u) => u.role === 'employee' && (u.managerId === (user._id || user.id)));
        setMyTeam(team);

        const today = new Date().toISOString().split('T')[0];
        const attendanceRes = await getAttendanceByDate(today);
        const allAttendance = attendanceRes.data || attendanceRes || [];
        const teamIds = team.map((t) => t._id || t.id);
        setTeamAttendance(allAttendance.filter((a) => teamIds.includes(a.userId)));
      } catch (err) {
        console.error('Failed to fetch attendance data:', err);
      }
    };
    fetchData();
  }, [user]);

  const filtered = teamAttendance.filter((a) => {
    const matchSearch = (a.userName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'userName',
      label: 'Employee',
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">
            {getInitials(v)}
          </div>
          <span className="font-medium">{v}</span>
        </div>
      ),
    },
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
              : v === 'Late'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Monitoring</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your team's attendance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{teamAttendance.filter((a) => a.status === 'Present').length}</p>
          <p className="text-sm text-gray-500">Present</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{teamAttendance.filter((a) => a.status === 'Absent').length}</p>
          <p className="text-sm text-gray-500">Absent</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{myTeam.length}</p>
          <p className="text-sm text-gray-500">Total Team</p>
        </div>
      </div>

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search employee..."
        filters={[
          {
            key: 'status',
            label: 'All Status',
            value: statusFilter,
            options: ['Present', 'Absent', 'Late'],
          },
        ]}
        onFilterChange={(k, v) => setStatusFilter(v)}
      />

      <div className="card p-0 overflow-hidden">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
