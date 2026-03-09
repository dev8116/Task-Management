import { useState } from 'react';
import DataTable from '../../components/tables/DataTable';
import SearchFilter from '../../components/SearchFilter';

export default function AttendanceLeave() {
  const [tab, setTab] = useState('attendance');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const allAttendance = JSON.parse(localStorage.getItem('flowtrack_attendance') || '[]');
  const allLeaves = JSON.parse(localStorage.getItem('flowtrack_leaves') || '[]');

  const handleLeaveAction = (id, action) => {
    const updated = allLeaves.map((l) => (l.id === id ? { ...l, status: action } : l));
    localStorage.setItem('flowtrack_leaves', JSON.stringify(updated));
    window.location.reload();
  };

  const filteredAttendance = allAttendance.filter((a) => {
    const matchSearch = (a.userName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredLeaves = allLeaves.filter((l) => {
    const matchSearch = (l.userName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const attendanceCols = [
    { key: 'userName', label: 'Employee' },
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check In', render: (v) => v || '—' },
    { key: 'checkOut', label: 'Check Out', render: (v) => v || '—' },
    { key: 'hours', label: 'Hours', render: (v) => `${v}h` },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{v}</span>
    )},
  ];

  const leaveCols = [
    { key: 'userName', label: 'Employee' },
    { key: 'type', label: 'Type' },
    { key: 'startDate', label: 'From' },
    { key: 'endDate', label: 'To' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : v === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{v}</span>
    )},
    { key: 'actions', label: 'Actions', render: (_, r) => r.status === 'Pending' ? (
      <div className="flex gap-2">
        <button onClick={() => handleLeaveAction(r.id, 'Approved')} className="text-xs btn-success py-1 px-3">Approve</button>
        <button onClick={() => handleLeaveAction(r.id, 'Rejected')} className="text-xs btn-danger py-1 px-3">Reject</button>
      </div>
    ) : '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance & Leave Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor attendance and manage leave requests</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setTab('attendance'); setSearch(''); setStatusFilter(''); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'attendance' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Attendance</button>
        <button onClick={() => { setTab('leaves'); setSearch(''); setStatusFilter(''); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'leaves' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Leave Requests</button>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder={`Search ${tab}...`}
        filters={[{
          key: 'status', label: 'All Status', value: statusFilter,
          options: tab === 'attendance' ? ['Present', 'Absent'] : ['Pending', 'Approved', 'Rejected'],
        }]}
        onFilterChange={(k, v) => setStatusFilter(v)}
      />

      <div className="card p-0 overflow-hidden">
        {tab === 'attendance'
          ? <DataTable columns={attendanceCols} data={filteredAttendance} />
          : <DataTable columns={leaveCols} data={filteredLeaves} />
        }
      </div>
    </div>
  );
}