import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/Common/DataTable";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import "./ProjectManagement.css";
import "./UserManagement.css";

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const STATUS_OPTIONS_ADMIN = ["Closed", "Cancelled"]; // allowed only when current status is Planning

const emptyForm = {
  name: "",
  description: "",
  status: "Planning",
  priority: "Medium",
  startDate: "",
  endDate: "",
  manager: "",
  githubRepoUrl: "", // ✅ added
};

const isValidGitHubRepoUrl = (url) => {
  if (!url || !String(url).trim()) return true;
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/?$/.test(
    String(url).trim(),
  );
};

const openLink = (url) => {
  const u = String(url || "").trim();
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
};

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchManagers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get("/projects");
      setProjects(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch projects");
    }
  };

  const fetchManagers = async () => {
    try {
      const { data } = await API.get("/users?role=manager");
      setManagers(data);
    } catch (err) {
      toast.error("Failed to fetch managers");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const generateDescription = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter project name first");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await API.post("/ai/project-description", {
        name: form.name,
        description: form.description,
      });
      setForm((prev) => ({
        ...prev,
        description: data.description || prev.description,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProject(null);
    setForm({ ...emptyForm, status: "Planning" });
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      status: project.status || "Planning",
      priority: project.priority || "Medium",
      startDate: project.startDate?.split("T")[0] || "",
      endDate: project.endDate?.split("T")[0] || "",
      manager: project.manager?._id || "",
      githubRepoUrl: project.githubRepoUrl || "", // ✅ added
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.manager) {
      toast.error("Please select a manager");
      return;
    }
    if (!isValidGitHubRepoUrl(form.githubRepoUrl)) {
      toast.error(
        "Please enter a valid GitHub Repository URL (https://github.com/owner/repo)",
      );
      return;
    }

    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, {
          status: form.status,
          description: form.description,
          githubRepoUrl: form.githubRepoUrl, // ✅ allow admin update
        });
        toast.success("Project updated successfully");
      } else {
        await API.post("/projects", form);
        toast.success("Project created and assigned to manager");
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await API.delete(`/projects/${id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

  const columns = [
    { header: "Project Name", accessor: "name" },
    {
      header: "Manager",
      render: (row) => (
        <span className="manager-badge">
          {row.manager?.name || "Not Assigned"}
        </span>
      ),
    },
    {
      header: "GitHub",
      render: (row) =>
        row.githubRepoUrl ? (
          <button
            className="action-btn github-btn"
            onClick={() => openLink(row.githubRepoUrl)}
          >
            View Repository
          </button>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>
        ),
    },
    {
      header: "Priority",
      render: (row) => (
        <span className={`priority-badge ${row.priority?.toLowerCase()}`}>
          {row.priority}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`status-badge ${row.status?.toLowerCase().replace(/ /g, "-")}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Progress",
      render: (row) => (
        <div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${row.progress || 0}%` }}
            />
          </div>
          <span className="progress-text">{row.progress || 0}%</span>
        </div>
      ),
    },
    { header: "Team", render: (row) => `${row.team?.length || 0} members` },
    { header: "Start", render: (row) => formatDate(row.startDate) },
    { header: "Deadline", render: (row) => formatDate(row.endDate) },
  ];

  const statusSelect = editingProject ? (
    <select
      name="status"
      value={form.status}
      onChange={handleChange}
      disabled={editingProject.status !== "Planning"}
    >
      <option value={form.status}>{form.status}</option>
      {editingProject.status === "Planning" &&
        STATUS_OPTIONS_ADMIN.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
    </select>
  ) : (
    <input value="Planning" disabled />
  );

  return (
    <div>
      <div className="page-header">
        <h2>Project Management</h2>
        <button className="add-btn" onClick={openCreate}>
          <FiPlus /> Create Project
        </button>
      </div>

      <DataTable
        title={`All Projects (${projects.length})`}
        columns={columns}
        data={projects}
        actions={(row) => (
          <>
            <button className="action-btn edit" onClick={() => openEdit(row)}>
              Edit
            </button>
            <button
              className="action-btn delete"
              onClick={() => handleDelete(row._id)}
            >
              Delete
            </button>
          </>
        )}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProject ? "Edit Project" : "Create New Project"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Project name"
                  required
                  disabled={!!editingProject}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Project description"
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={generateDescription}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Generating..." : "AI Suggest Description"}
                </button>
              </div>

              {/* ✅ GitHub repo url */}
              <div className="form-group">
                <label>GitHub Repository URL</label>
                <input
                  name="githubRepoUrl"
                  value={form.githubRepoUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/owner/repo"
                />
              </div>

              <div className="form-group">
                <label>Assign Manager *</label>
                <select
                  name="manager"
                  value={form.manager}
                  onChange={handleChange}
                  required
                  disabled={!!editingProject}
                >
                  <option value="">-- Select a Manager --</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.department || "No Dept"}) —{" "}
                      {m.teamMembers?.length || 0} team members
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  {statusSelect}
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    disabled={!!editingProject}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                    disabled={!!editingProject}
                  />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={handleChange}
                    required
                    disabled={!!editingProject}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingProject ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
