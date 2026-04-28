import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/Common/DataTable';
import { toast } from 'react-toastify';
import './ApplyLeave.css';

const ApplyLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setLoading(true);
    try {
      await API.post('/leaves', form);
      toast.success('Leave application submitted!');
      setForm({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const columns = [
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
    { header: 'Remarks', render: (row) => row.remarks || '--' },
    { header: 'Applied On', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <div className="page-header"><h2>Leave Management</h2></div>

      {/* Apply Leave Form */}
      <div className="leave-form-container">
        <h3>Apply for Leave</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Type</label>
            <select name="leaveType" value={form.leaveType} onChange={handleChange}>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea name="reason" value={form.reason} onChange={handleChange} placeholder="Enter reason for leave" required />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>

      {/* Leave History */}
      <DataTable title={`My Leave History (${leaves.length})`} columns={columns} data={leaves} />
    </div>
  );
};

export default ApplyLeave;