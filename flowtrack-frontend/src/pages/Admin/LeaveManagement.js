import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await API.get('/leaves');
      setLeaves(data);
    } catch (err) {
      toast.error('Failed to fetch leaves');
    }
  };

  const handleAction = async (id, status) => {
    try {
      await API.put(`/leaves/${id}`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to update leave');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const columns = [
    { header: 'Employee', render: (row) => row.user?.name || 'N/A' },
    { header: 'Type', accessor: 'leaveType' },
    { header: 'From', render: (row) => formatDate(row.startDate) },
    { header: 'To', render: (row) => formatDate(row.endDate) },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status?.toLowerCase()}`}>{row.status}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Leave Management</h2>
      </div>
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
              {row.approvedBy?.name ? `By ${row.approvedBy.name}` : '--'}
            </span>
          )
        }
      />
    </div>
  );
};

export default LeaveManagement;