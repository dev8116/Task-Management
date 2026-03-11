import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await API.get('/activity-logs?limit=100');
      setLogs(data);
    } catch (err) {
      toast.error('Failed to fetch activity logs');
    }
  };

  const formatDateTime = (d) => new Date(d).toLocaleString();

  const columns = [
    { header: 'User', render: (row) => row.user?.name || 'N/A' },
    { header: 'Role', render: (row) => <span className={`status-badge`} style={{ background: '#e3f2fd', color: '#1565c0' }}>{row.user?.role || 'N/A'}</span> },
    {
      header: 'Action',
      render: (row) => (
        <span className="priority-badge medium">{row.action?.replace(/_/g, ' ')}</span>
      ),
    },
    { header: 'Description', accessor: 'description' },
    { header: 'Date & Time', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Activity Logs</h2>
      </div>
      <DataTable title={`Activity Logs (${logs.length})`} columns={columns} data={logs} />
    </div>
  );
};

export default ActivityLogs;