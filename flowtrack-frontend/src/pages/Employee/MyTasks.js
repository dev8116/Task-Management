import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import "./MyTasks.css";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Submit Completion Modal ──
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load tasks");
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
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  // ── Open / close submit modal ──
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

  // ── Submit completion file ──
  const handleSubmitCompletion = async () => {
    if (!submitFile) return toast.error("Please select a file to upload");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submissionFile", submitFile);
      await api.post(
        `/tasks/${submittingTask._id}/submit-completion`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      toast.success("Submitted! Waiting for manager approval.");
      closeSubmitModal();
      fetchTasks();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
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
              {/* Header */}
              <div className="mytask-card-header">
                <span className="mytask-title">{task.title}</span>
                <span className={`mytask-badge badge-${task.status}`}>
                  {task.status === "pending-approval"
                    ? "Pending Approval"
                    : task.status}
                </span>
              </div>

              {/* Description */}
              {task.description && (
                <p className="mytask-desc">{task.description}</p>
              )}

              {/* Meta */}
              <div className="mytask-meta">
                <span
                  className={`priority-badge priority-${task.priority || "medium"}`}
                >
                  {task.priority || "medium"}
                </span>
                {task.dueDate && (
                  <span role="img" aria-label="due">
                    📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {task.project?.name && (
                  <span>Project: {task.project.name}</span>
                )}
              </div>

              {/* Actions (toggle or submit) */}
              <div className="mytask-actions">
                {task.status === "pending" && (
                  <button
                    onClick={() => handleStatusToggle(task._id, "in-progress")}
                  >
                    Start
                  </button>
                )}
                {task.status === "in-progress" && (
                  <>
                    <button
                      onClick={() => handleStatusToggle(task._id, "pending")}
                    >
                      Mark Pending
                    </button>
                    <button onClick={() => openSubmitModal(task)}>
                      Submit Work
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit modal (lightweight) */}
      {showSubmitModal && (
        <div className="submit-modal">
          <div className="submit-modal-content">
            <h4>Submit completion for: {submittingTask?.title}</h4>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setSubmitFile(e.target.files[0])}
            />
            <div className="modal-actions">
              <button
                className="btn-primary"
                disabled={submitting}
                onClick={handleSubmitCompletion}
              >
                {submitting ? "Uploading..." : "Submit"}
              </button>
              <button className="btn-secondary" onClick={closeSubmitModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
