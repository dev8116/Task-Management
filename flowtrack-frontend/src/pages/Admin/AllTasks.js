import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks');
      // Normalize response: many endpoints return either:
      //  - array directly, or
      //  - { data: [...] }, or
      //  - { success: true, data: [...] }
      const tasksData = res?.data?.data ?? res?.data ?? res;
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      toast.error('Failed to fetch tasks');
      setTasks([]);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : 'N/A');

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Project', render: (row) => row.project?.name || 'N/A' },
    { header: 'Assigned To', render: (row) => row.assignedTo?.name || 'N/A' },
    {
      header: 'Priority',
      render: (row) => <span className={`priority-badge ${row.priority?.toLowerCase()}`}>{row.priority}</span>,
    },
    {
      header: 'Status',
      render: (row) => {
        const isOverdue = row.deadline ? new Date(row.deadline) < new Date() && row.status !== 'Completed' : false;
        return <span className={`status-badge ${isOverdue ? 'overdue' : row.status?.toLowerCase().replace(/ /g, '-')}`}>
          {isOverdue ? 'Overdue' : row.status}
        </span>;
      },
    },
    { header: 'Deadline', render: (row) => formatDate(row.deadline) },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>All Tasks</h2>
      </div>
      <DataTable title={`Tasks (${Array.isArray(tasks) ? tasks.length : 0})`} columns={columns} data={tasks} />
    </div>
  );
};

export default AllTasks;