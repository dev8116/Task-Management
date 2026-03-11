import React, { useEffect, useState } from "react";
import api from "../../api/axios"; // adjust import path to match your project
import { toast } from "react-toastify";
import { FiUpload, FiX } from "react-icons/fi";
import "./MyTasks.css";

export default function MyTasks() {
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);

  // ── Submit Completion Modal ──
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingTask, setSubmittingTask]   = useState(null);
  const [submitFile, setSubmitFile]           = useState(null);
  const [submitting, setSubmitting]           = useState(false);

  useEffect(() => {
    fetchTasks();
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

  // ── Toggle: pending ↔ in-progress ──
  const handleStatusToggle = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Status changed to "${newStatus}"`);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // ── Open Submit Completion modal ──
  const openSubmitModal = (task) => {
    setSubmittingTask(task);
    setSubmitFile(null);
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSubmittingTask(null);
    setSubmitFile(null);
  };

  // ── Submit file to backend ──
  const handleSubmitCompletion = async () => {
    if (!submitFile) return toast.error("Please select a file to upload");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submissionFile", submitFile);
      await api.post(`/tasks/${submittingTask._id}/submit-completion`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Submitted! Waiting for manager approval.");
      closeSubmitModal();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mytasks-loading">Loading tasks...</div>;

  return (
    <div className="mytasks-container">
      <h2 className="mytasks-title">My Tasks</h2>

      {tasks.length === 0 ? (
        <p className="mytasks-empty">No tasks assigned to you yet.</p>
      ) : (
        <div className="mytasks-list">
          {tasks.map((task) => (
            <div key={task._id} className={`mytask-card status-${task.status}`}>
              {/* ── Card Header ── */}
              <div className="mytask-card-header">
                <span className="mytask-title">{task.title}</span>
                <span className={`mytask-badge badge-${task.status}`}>
                  {task.status === "pending-approval" ? "⏳ Pending Approval" : task.status}
                </span>
              </div>

              {/* ── Description ── */}
              {task.description && (
                <p className="mytask-desc">{task.description}</p>
              )}

              {/* ── Meta ── */}
              <div className="mytask-meta">
                <span className={`priority-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="mytask-due">
                    📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {task.project?.title && (
                  <span className="mytask-project">📁 {task.project.title}</span>
                )}
              </div>

              {/* ── Rejection note (if rejected) ── */}
              {task.submissionStatus === "rejected" && task.submissionNote && (
                <div className="mytask-rejected-note">
                  ❌ Rejected: {task.submissionNote}
                </div>
              )}

              {/* ── Actions ── */}
              <div className="mytask-actions">

                {/* pending → Start Task (in-progress) */}
                {task.status === "pending" && (
                  <button
                    className="mytask-btn btn-start"
                    onClick={() => handleStatusToggle(task._id, "in-progress")}
                  >
                    ▶ Start Task
                  </button>
                )}

                {/* in-progress → revert to pending OR submit completion */}
                {task.status === "in-progress" && (
                  <>
                    <button
                      className="mytask-btn btn-revert"
                      onClick={() => handleStatusToggle(task._id, "pending")}
                    >
                      ↩ Set Pending
                    </button>
                    <button
                      className="mytask-btn btn-submit"
                      onClick={() => openSubmitModal(task)}
                    >
                      <FiUpload style={{ marginRight: 4 }} />
                      Submit Completion
                    </button>
                  </>
                )}

                {/* pending-approval: waiting */}
                {task.status === "pending-approval" && (
                  <span className="mytask-waiting">⏳ Awaiting manager approval...</span>
                )}

                {/* completed */}
                {task.status === "completed" && (
                  <span className="mytask-done">✅ Task Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ Submit Completion Modal ══ */}
      {showSubmitModal && submittingTask && (
        <div className="modal-overlay" onClick={closeSubmitModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Completion</h3>
              <button className="modal-close-btn" onClick={closeSubmitModal}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-task-name">📋 Task: <strong>{submittingTask.title}</strong></p>
              <p className="modal-hint">
                Upload your work proof — PDF, Word document (.doc / .docx), or a screenshot (JPG / PNG).
              </p>

              <div className="file-upload-area">
                <label htmlFor="submissionFileInput" className="file-upload-label">
                  <FiUpload size={20} />
                  <span>{submitFile ? submitFile.name : "Choose File"}</span>
                </label>
                <input
                  id="submissionFileInput"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  style={{ display: "none" }}
                  onChange={(e) => setSubmitFile(e.target.files[0])}
                />
              </div>

              {submitFile && (
                <p className="file-selected">
                  ✅ Selected: <strong>{submitFile.name}</strong>{" "}
                  <span style={{ color: "#888", fontSize: "12px" }}>
                    ({(submitFile.size / 1024).toFixed(1)} KB)
                  </span>
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button className="mytask-btn btn-revert" onClick={closeSubmitModal}>
                Cancel
              </button>
              <button
                className="mytask-btn btn-submit"
                onClick={handleSubmitCompletion}
                disabled={!submitFile || submitting}
              >
                {submitting ? "Uploading..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}