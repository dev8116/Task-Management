import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus } from 'react-icons/hi';
import Modal from '../../components/Modal';
import DataTable from '../../components/tables/DataTable';
import { applyLeave, getLeaves } from '../../services/leaveService';

export default function LeaveRequest() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [form, setForm] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      const res = await getLeaves(user._id || user.id);
      setMyLeaves(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }
  };

  useEffect(() => { fetchLeaves(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) return;

    try {
      await applyLeave({
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      await fetchLeaves();
      setShowModal(false);
      setForm({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      console.error('Failed to apply leave:', err);
    }
  };

  const pendingCount = myLeaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = myLeaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = myLeaves.filter((l) => l.status === 'Rejected').length;

  const columns = [
    { key: 'type', label: 'Type' },
    { key: 'startDate', label: 'From' },
    { key: 'endDate', label: 'To' },
    { key: 'reason', label: 'Reason', render: (v) => <span className="line-clamp-1">{v}</span> },
    { key: 'appliedOn', label: 'Applied On' },
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leave Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Apply for leaves and track their status
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus size={18} /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={[...myLeaves].sort(
            (a, b) => new Date(b.appliedOn) - new Date(a.appliedOn)
          )}
        />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Leave Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input-field"
            >
              <option>Casual Leave</option>
              <option>Sick Leave</option>
              <option>Earned Leave</option>
              <option>Maternity Leave</option>
              <option>Paternity Leave</option>
              <option>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date *
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason *
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input-field"
              rows={3}
              required
              placeholder="Enter reason for leave..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
