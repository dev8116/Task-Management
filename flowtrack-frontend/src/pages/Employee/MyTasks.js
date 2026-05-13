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

const formatRecurrence = (rec) => {
  if (!rec?.enabled) return '—';
  if (rec.frequency === 'daily') return `Daily · every ${rec.interval || 1} day(s)`;
  if (rec.frequency === 'weekly') {
    const days = (rec.daysOfWeek || [])
      .map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d])
      .join(', ');
    return `Weekly · every ${rec.interval || 1} week(s) ${days ? `(${days})` : ''}`;
  }
  if (rec.frequency === 'monthly') {
    return `Monthly · day ${rec.dayOfMonth || 1} every ${rec.interval || 1} month(s)`;
  }
  return '—';
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const updateChecklist = async (taskId, checklist) => {
    try {
      await api.patch(`/tasks/${taskId}/checklist`, { checklist });
      fetchTasks();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update checklist");
    }
  };

  const updateSubtasks = async (taskId, subtasks) => {
    try {
      await api.patch(`/tasks/${taskId}/subtasks`, { subtasks });
      fetchTasks();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update subtasks");
    }
  };

  const handleStatusToggle = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Status changed to "${newStatus}"`);
      fetchTasks();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const openSubmitModal = (task) => {
    setSubmittingTask(task);
    setSubmitFile(null);
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

  const handleSubmitCompletion = async () => {
    if (!String(githubCommitUrl || "").trim()) return toast.error("GitHub commit URL is required");
    if (!String(githubPullRequestUrl || "").trim()) return toast.error("GitHub pull request URL is required");

    if (!isValidGitHubCommitUrl(githubCommitUrl)) {
      return toast.error("Invalid GitHub commit URL");
    }
    if (!isValidGitHubPullUrl(githubPullRequestUrl)) {
      return toast.error("Invalid GitHub pull request URL");
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      if (submitFile) {
        formData.append("submissionFile", submitFile);
      }

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
          {tasks.map((task) => {
            const blockedBy = (task.dependsOn || []).filter((d) => d.status !== "completed");
            const blocking = task.blocking || [];
            const isBlocked = blockedBy.length > 0;

            const checklistTotal = task.checklist?.length || 0;
            const checklistDone = task.checklist?.filter((c) => c.done).length || 0;

            const subtasksTotal = task.subtasks?.length || 0;
            const subtasksDone = task.subtasks?.filter((s) => s.status === "completed").length || 0;

            return (
              <div key={task._id} className={`mytask-card status-${task.status}`}>
                <div className="mytask-card-header">
                  <span className="mytask-title">{task.title}</span>
                  <span className={`mytask-badge badge-${task.status}`}>
                    {task.status === "pending-approval" ? "Pending Approval" : task.status}
                  </span>
                </div>

                {task.description && <p className="mytask-desc">{task.description}</p>}

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

                <div className="mytask-section">
                  <h4>Dependencies</h4>
                  {blockedBy.length === 0 ? (
                    <p className="mytask-muted">No blocking tasks.</p>
                  ) : (
                    <ul className="mytask-list">
                      {blockedBy.map((d) => (
                        <li key={d._id}>⛔ {d.title} ({d.status})</li>
                      ))}
                    </ul>
                  )}
                  {blocking.length > 0 && (
                    <>
                      <h5>Blocking</h5>
                      <ul className="mytask-list">
                        {blocking.map((d) => (
                          <li key={d._id}>✅ {d.title} ({d.status})</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {subtasksTotal > 0 && (
                  <div className="mytask-section">
                    <h4>Subtasks ({subtasksDone}/{subtasksTotal})</h4>
                    {task.subtasks.map((sub) => (
                      <div key={sub._id} className="mytask-subtask">
                        <div>
                          <strong>{sub.title}</strong>
                          {sub.description && <p>{sub.description}</p>}
                        </div>
                        <select
                          value={sub.status}
                          disabled={task.status === "completed"}
                          onChange={(e) => {
                            const updated = task.subtasks.map((s) =>
                              s._id === sub._id ? { ...s, status: e.target.value } : s
                            );
                            updateSubtasks(task._id, updated);
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {checklistTotal > 0 && (
                  <div className="mytask-section">
                    <h4>Checklist ({checklistDone}/{checklistTotal})</h4>
                    {task.checklist.map((item) => (
                      <label key={item._id} className="mytask-check">
                        <input
                          type="checkbox"
                          checked={item.done}
                          disabled={task.status === "completed"}
                          onChange={() => {
                            const updated = task.checklist.map((c) =>
                              c._id === item._id ? { ...c, done: !c.done } : c
                            );
                            updateChecklist(task._id, updated);
                          }}
                        />
                        <span className={item.done ? "done" : ""}>{item.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="mytask-section">
                  <h4>Recurring</h4>
                  <p className="mytask-muted">{formatRecurrence(task.recurrence)}</p>
                </div>

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

                <div className="mytask-actions">
                  {task.status === "pending" && (
                    <button onClick={() => handleStatusToggle(task._id, "in-progress")} disabled={isBlocked}>
                      {isBlocked ? "Blocked" : "Start"}
                    </button>
                  )}
                  {task.status === "in-progress" && (
                    <>
                      <button onClick={() => handleStatusToggle(task._id, "pending")}>Mark Pending</button>
                      <button onClick={() => openSubmitModal(task)} disabled={isBlocked}>
                        {isBlocked ? "Blocked" : "Submit Work"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSubmitModal && (
        <div className="ft-modal-overlay" onClick={closeSubmitModal}>
          <div className="ft-modal ft-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3>Submit completion</h3>
              <button className="ft-modal-close" onClick={closeSubmitModal}>✕</button>
            </div>
            <div className="ft-modal-body">
              <p className="ft-modal-subtitle">{submittingTask?.title}</p>

              <label className="ft-modal-label">GitHub Commit URL *</label>
              <input
                className="ft-modal-input"
                type="text"
                placeholder="https://github.com/owner/repo/commit/sha"
                value={githubCommitUrl}
                onChange={(e) => setGithubCommitUrl(e.target.value)}
              />

              <label className="ft-modal-label">GitHub Pull Request URL *</label>
              <input
                className="ft-modal-input"
                type="text"
                placeholder="https://github.com/owner/repo/pull/123"
                value={githubPullRequestUrl}
                onChange={(e) => setGithubPullRequestUrl(e.target.value)}
              />

              <label className="ft-modal-label">Upload File (Optional)</label>
              <input
                className="ft-modal-input"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setSubmitFile(e.target.files[0])}
              />
            </div>
            <div className="ft-modal-footer">
              <button className="btn-secondary" onClick={closeSubmitModal}>
                Cancel
              </button>
              <button className="btn-primary" disabled={submitting} onClick={handleSubmitCompletion}>
                {submitting ? "Uploading..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}