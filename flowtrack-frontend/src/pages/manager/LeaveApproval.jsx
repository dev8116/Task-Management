import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import SearchFilter from '../../components/SearchFilter';
import { getAllLeaves, approveLeave, rejectLeave } from '../../services/leaveService';
import { getAllUsers } from '../../services/userService';

export default function LeaveApproval() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamLeaves, setTeamLeaves] = useState([]);

  const fetchLeaves = async () => {
    try {
      const [leavesRes, usersRes] = await Promise.all([
        getAllLeaves(),
        getAllUsers(),
      ]);
      const allLeaves = leavesRes.data || leavesRes || [];
      const allUsers = usersRes.data || usersRes || [];
      const team = allUsers.filter((u) => u.role === 'employee' && (u.managerId === (user._id || user.id)));
      const teamIds = team.map((t) => t._id || t.id);
      setTeamLeaves(allLeaves.filter((l) => teamIds.includes(l.userId)));
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }
  };

  useEffect(() => { fetchLeaves(); }, [user]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'Approved') {
        await approveLeave(id);
      } else {
        await rejectLeave(id);
      }
      await fetchLeaves();
    } catch (err) {
      console.error('Failed to update leave:', err);
    }
  };

  const filtered = teamLeaves.filter((l) => {
    const matchSearch = (l.userName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns = [
    { key: 'userName', label: 'Employee', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'type', label: 'Leave Type' },
    { key: 'startDate', label: 'From' },
    { key: 'endDate', label: 'To' },
    { key: 'reason', label: 'Reason', render: (v) => <span className="line-clamp-1">{v}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            v === 'Approved'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : v === 'Rejected'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {v}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) =>
        r.status === 'Pending' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(r._id || r.id, 'Approved')}
              className="text-xs btn-success py-1 px-3"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(r._id || r.id, 'Rejected')}
              className="text-xs btn-danger py-1 px-3"
            >
              Reject
            </button>
          </div>
        ) : (
          '—'
        ),
    },
  ];

  const pendingCount = teamLeaves.filter((l) => l.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Approval</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your team's leave requests
          {pendingCount > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search leaves..."
        filters={[
          {
            key: 'status',
            label: 'All Status',
            value: statusFilter,
            options: ['Pending', 'Approved', 'Rejected'],
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
