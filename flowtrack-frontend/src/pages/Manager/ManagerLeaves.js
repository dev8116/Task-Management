import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leaveRes, teamRes] = await Promise.all([
        API.get('/leaves'),
        API.get('/users/my-team'),
      ]);

      // Filter leaves to only show team members' requests
      const teamIds = teamRes.data.map((m) => m._id);
      const teamLeaves = leaveRes.data.filter((l) => teamIds.includes(l.user?._id));

      setLeaves(teamLeaves);
      setTeamMembers(teamRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    }
  };

  const handleAction = async (id, status) => {
    const remarks = prompt(`Enter remarks for ${status.toLowerCase()} (optional):`) || '';
    try {
      await API.put(`/leaves/${id}`, { status, remarks });
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const getDays = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const columns = [
    { header: 'Employee', render: (row) => row.user?.name || 'N/A' },
    { header: 'Type', accessor: 'leaveType' },
    { header: 'From', render: (row) => formatDate(row.startDate) },
    { header: 'To', render: (row) => formatDate(row.endDate) },
    { header: 'Days', render: (row) => getDays(row.startDate, row.endDate) },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status?.toLowerCase()}`}>{row.status}</span>
      ),
    },
    { header: 'Remarks', render: (row) => row.remarks || '--' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Leave Requests</h2>
        <span style={{ fontSize: '14px', color: '#888' }}>
          Showing requests from your {teamMembers.length} team members
        </span>
      </div>

      {leaves.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '16px', color: '#888' }}>No leave requests from your team</p>
        </div>
      ) : (
        <DataTable
          title={`Leave Requests (${leaves.length})`}
          columns={columns}
          data={leaves}
          actions={(row) =>
            row.status === 'Pending' ? (
              <>
                <button className="action-btn approve" onClick={() => handleAction(row._id, 'Approved')}>Approve</button>
                <button className="action-btn reject" onClick={() => handleAction(row._id, 'Rejected')}>Reject</button>
              </>
            ) : (
              <span style={{ fontSize: '12px', color: '#888' }}>
                {row.status} {row.approvedBy?.name ? `by ${row.approvedBy.name}` : ''}
              </span>
            )
          }
        />
      )}
    </div>
  );
};

export default ManagerLeaves;