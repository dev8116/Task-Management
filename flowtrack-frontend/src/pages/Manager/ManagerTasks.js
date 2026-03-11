import React, { useEffect, useState } from "react";
import api from "../../api/axios"; // adjust import path to match your project
import { toast } from "react-toastify";
import { FiPlus, FiX, FiFile, FiCheckCircle, FiXCircle } from "react-icons/fi";
import "./ManagerTasks.css";

export default function ManagerTasks() {
  const [tasks, setTasks]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);

  // ── Create Task modal ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", dueDate: "", status: "pending",
  });
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Assign Employee modal ──
  const [showAssignModal, setShowAssignModal]   = useState(false);
  const [assigningTask, setAssigningTask]       = useState(null);
  const [assignEmpId, setAssignEmpId]           = useState("");

  // ── Review Submission modal ──
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingTask, setReviewingTask]     = useState(null);
  const [rejectNote, setRejectNote]           = useState("");
  const [reviewing, setReviewing]             = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchTeamEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data.data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamEmployees = async () => {
    try {
      const res = await api.get("/users/team");
      setEmployees(res.data.data || []);
    } catch {}
  };

  // ── Create Task ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Task title is required");
    setCreating(true);
    try {
      const payload = {
        ...form,
        assignedEmployees: selectedEmployee ? [selectedEmployee] : [],
      };
      await api.post("/tasks", payload);
      toast.success("Task created!");
      setShowCreateModal(false);
      resetForm();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", priority: "medium", dueDate: "", status: "pending" });
    setSelectedEmployee("");
  };

  // ── Assign Employee ──
  const openAssignModal = (task) => {
    setAssigningTask(task);
    const current = task.assignedEmployees?.[0];
    setAssignEmpId(typeof current === "object" ? current?._id : current || "");
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignEmpId) return toast.error("Please select an employee");
    try {
      await api.put(`/tasks/${assigningTask._id}`, { assignedEmployees: [assignEmpId] });
      toast.success("Employee assigned!");
      setShowAssignModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign");
    }
  };

  // ── Review Submission ──
  const openReviewModal = (task) => {
    setReviewingTask(task);
    setRejectNote("");
    setShowReviewModal(true);
  };

  const handleReview = async (decision) => {
    setReviewing(true);
    try {
      await api.patch(`/tasks/${reviewingTask._id}/review-submission`, {
        decision,
        note: rejectNote,
      });
      toast.success(decision === "approved" ? "✅ Task approved & completed!" : "❌ Submission rejected.");
      setShowReviewModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Review failed");
    } finally {
      setReviewing(false);
    }
  };

  // ── View uploaded file ──
  const handleViewFile = (taskId) => {
    const base = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    window.open(`${base}/tasks/${taskId}/submission-file`, "_blank");
  };

  if (loading) return <div className="mgrtasks-loading">Loading tasks...</div>;

  return (
    <div className="mgrtasks-container">
      <div className="mgrtasks-header">
        <h2 className="mgrtasks-title">Manage Tasks</h2>
        <button className="mgrtask-btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <FiPlus style={{ marginRight: 6 }} /> Create Task
        </button>
      </div>

      {/* ── Task Table ── */}
      <div className="mgrtasks-table-wrapper">
        <table className="mgrtasks-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Submission</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const empNames = (t.assignedEmployees || []).map((e) => e.name || e).join(", ");
              return (
                <tr key={t._id}>
                  <td><strong>{t.title}</strong></td>
                  <td>
                    <span className={`mgr-badge badge-${t.status}`}>
                      {t.status === "pending-approval" ? "⏳ Pending Approval" : t.status}
                    </span>
                  </td>
                  <td>
                    <span className={`mgr-priority priority-${t.priority}`}>{t.priority}</span>
                  </td>
                  <td>{empNames || "—"}</td>
                  <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
                  <td>
                    {t.submissionFile?.filename ? (
                      <button
                        className="mgrtask-btn btn-file"
                        onClick={() => handleViewFile(t._id)}
                        title={t.submissionFile.filename}
                      >
                        <FiFile style={{ marginRight: 4 }} />
                        View File
                      </button>
                    ) : (
                      <span style={{ color: "#aaa", fontSize: "13px" }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="mgr-actions">
                      {/* Assign / Re-assign (not for completed) */}
                      {t.status !== "completed" && (
                        <button
                          className="mgrtask-btn btn-secondary"
                          onClick={() => openAssignModal(t)}
                        >
                          {empNames ? "Re-assign" : "Assign"}
                        </button>
                      )}

                      {/* Review Submission */}
                      {t.status === "pending-approval" && (
                        <button
                          className="mgrtask-btn btn-review"
                          onClick={() => openReviewModal(t)}
                        >
                          Review
                        </button>
                      )}

                      {t.status === "completed" && (
                        <span className="mgr-done">✅ Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!tasks.length && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#aaa", padding: "24px" }}>
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══ Create Task Modal ══ */}
      {showCreateModal && (
        <div className="mgr-modal-overlay" onClick={() => { setShowCreateModal(false); resetForm(); }}>
          <div className="mgr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3>Create Task</h3>
              <button className="mgr-modal-close" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mgr-modal-body">
              <div className="mgr-form-group">
                <label>Title *</label>
                <input
                  type="text" placeholder="Task title" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required
                />
              </div>
              <div className="mgr-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Task description" rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="mgr-form-group">
                <label>Assign Employee</label>
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* ✅ Initial Status — ONLY time manager can set status */}
              <div className="mgr-form-group">
                <label>Initial Status <span style={{ color: "#888", fontSize: "12px" }}>(cannot be changed later)</span></label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                </select>
              </div>

              <div className="mgr-form-row">
                <div className="mgr-form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="mgr-form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="mgr-modal-footer">
                <button type="button" className="mgrtask-btn btn-secondary"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="mgrtask-btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Assign Employee Modal ══ */}
      {showAssignModal && assigningTask && (
        <div className="mgr-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="mgr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3>Assign Employee — {assigningTask.title}</h3>
              <button className="mgr-modal-close" onClick={() => setShowAssignModal(false)}><FiX /></button>
            </div>
            <div className="mgr-modal-body">
              <div className="mgr-form-group">
                <label>Select Employee</label>
                <select value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mgr-modal-footer">
              <button className="mgrtask-btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="mgrtask-btn btn-primary" onClick={handleAssign} disabled={!assignEmpId}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Review Submission Modal ══ */}
      {showReviewModal && reviewingTask && (
        <div className="mgr-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="mgr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3><FiFile style={{ marginRight: 6 }} />Review Submission — {reviewingTask.title}</h3>
              <button className="mgr-modal-close" onClick={() => setShowReviewModal(false)}><FiX /></button>
            </div>
            <div className="mgr-modal-body">
              <p style={{ marginBottom: 12, color: "#555" }}>
                Employee: <strong>
                  {(reviewingTask.assignedEmployees || []).map((e) => e.name || e).join(", ") || "—"}
                </strong>
              </p>

              {/* View File */}
              {reviewingTask.submissionFile?.filename && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Submitted File:</p>
                  <button
                    className="mgrtask-btn btn-file"
                    onClick={() => handleViewFile(reviewingTask._id)}
                  >
                    <FiFile style={{ marginRight: 6 }} />
                    View / Download: {reviewingTask.submissionFile.filename}
                  </button>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                    Uploaded: {new Date(reviewingTask.submissionFile.uploadedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Rejection Note */}
              <div className="mgr-form-group">
                <label>Rejection Note <span style={{ color: "#aaa", fontSize: 12 }}>(fill only if rejecting)</span></label>
                <textarea
                  placeholder="Reason for rejection..."
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
            </div>
            <div className="mgr-modal-footer">
              <button className="mgrtask-btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button
                className="mgrtask-btn btn-reject"
                onClick={() => handleReview("rejected")}
                disabled={reviewing}
              >
                <FiXCircle style={{ marginRight: 4 }} /> Reject
              </button>
              <button
                className="mgrtask-btn btn-approve"
                onClick={() => handleReview("approved")}
                disabled={reviewing}
              >
                <FiCheckCircle style={{ marginRight: 4 }} /> Approve & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}