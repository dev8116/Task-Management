import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";
import "./MyTasks.css";

const isValidGitHubCommitUrl = (url) => {
  if (!url || !String(url).trim()) return true;
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/commit\/[0-9a-fA-F]{7,40}\/?$/.test(String(url).trim());
};

const isValidGitHubPullUrl = (url) => {
  if (!url || !String(url).trim()) return true;
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/pull\/\d+\/?$/.test(String(url).trim());
};

const openLink = (url) => {
  const u = String(url || '').trim();
  if (!u) return;
  window.open(u, '_blank', 'noopener,noreferrer');
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Submit Completion Modal ──
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ GitHub fields employee submits
  const [githubCommitUrl, setGithubCommitUrl] = useState("");
  const [githubPullRequestUrl, setGithubPullRequestUrl] = useState("");

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

    // preload existing values if resubmitting
    setGithubCommitUrl(task.githubCommitUrl || "");
    setGithubPullRequestUrl(task.githubPullRequestUrl || "");

    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setSubmittingTask(null);
    setSubmitFile(null);
    setGithubCommitUrl("");
    setGithubPullRequestUrl("");
  };

  // ── Submit completion file + github urls ──
  const handleSubmitCompletion = async () => {
    // keep old requirement: file is required (you had this before)
    if (!submitFile) return toast.error("Please select a file to upload");

    if (!isValidGitHubCommitUrl(githubCommitUrl)) {
      return toast.error("Invalid GitHub commit URL");
    }
    if (!isValidGitHubPullUrl(githubPullRequestUrl)) {
      return toast.error("Invalid GitHub pull request URL");
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submissionFile", submitFile);

      // ✅ add GitHub links
      formData.append("githubCommitUrl", githubCommitUrl);
      formData.append("githubPullRequestUrl", githubPullRequestUrl);

      await api.post(`/tasks/${submittingTask._id}/submit-completion`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
                  {task.status === "pending-approval" ? "Pending Approval" : task.status}
                </span>
              </div>

              {/* Description */}
              {task.description && <p className="mytask-desc">{task.description}</p>}

              {/* Meta */}
              <div className="mytask-meta">
                <span className={`priority-badge priority-${task.priority || "medium"}`}>
                  {task.priority || "medium"}
                </span>
                {task.dueDate && (
                  <span role="img" aria-label="due">
                    📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                {task.project?.name && <span>Project: {task.project.name}</span>}
              </div>

              {/* GitHub buttons (employee view) */}
              <div className="mytask-meta">
                {task.project?.githubRepoUrl ? (
                  <button className="mytasks-linkbtn" onClick={() => openLink(task.project.githubRepoUrl)}>
                    View Repository
                  </button>
                ) : null}

                {task.githubIssueUrl ? (
                  <button className="mytasks-linkbtn" onClick={() => openLink(task.githubIssueUrl)}>
                    View Issue
                  </button>
                ) : null}

                {task.githubCommitUrl ? (
                  <button className="mytasks-linkbtn" onClick={() => openLink(task.githubCommitUrl)}>
                    View Commit
                  </button>
                ) : null}

                {task.githubPullRequestUrl ? (
                  <button className="mytasks-linkbtn" onClick={() => openLink(task.githubPullRequestUrl)}>
                    View Pull Request
                  </button>
                ) : null}
              </div>

              {/* Actions (toggle or submit) */}
              <div className="mytask-actions">
                {task.status === "pending" && (
                  <button onClick={() => handleStatusToggle(task._id, "in-progress")}>Start</button>
                )}
                {task.status === "in-progress" && (
                  <>
                    <button onClick={() => handleStatusToggle(task._id, "pending")}>Mark Pending</button>
                    <button onClick={() => openSubmitModal(task)}>Submit Work</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="submit-modal">
          <div className="submit-modal-content">
            <h4>Submit completion for: {submittingTask?.title}</h4>

            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>GitHub Commit URL</label>
            <input
              type="text"
              placeholder="https://github.com/owner/repo/commit/sha"
              value={githubCommitUrl}
              onChange={(e) => setGithubCommitUrl(e.target.value)}
            />

            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>GitHub Pull Request URL</label>
            <input
              type="text"
              placeholder="https://github.com/owner/repo/pull/123"
              value={githubPullRequestUrl}
              onChange={(e) => setGithubPullRequestUrl(e.target.value)}
            />

            <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Upload File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setSubmitFile(e.target.files[0])}
            />

            <div className="modal-actions">
              <button className="btn-primary" disabled={submitting} onClick={handleSubmitCompletion}>
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