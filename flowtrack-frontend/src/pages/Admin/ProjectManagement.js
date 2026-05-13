import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/Common/DataTable";
import { toast } from "react-toastify";
import "./ProjectManagement.css";

const STATUS_OPTIONS = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Closed",
  "Cancelled",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    startDate: "",
    endDate: "",
    manager: "",
    githubRepoUrl: "",
  });

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
      const { data } = await API.get("/users");
      setManagers(data.filter((u) => u.role === "manager"));
    } catch (err) {
      toast.error("Failed to fetch managers");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditingProject(null);
    setForm({
      name: "",
      description: "",
      status: "Planning",
      priority: "Medium",
      startDate: "",
      endDate: "",
      manager: "",
      githubRepoUrl: "",
    });
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
      githubRepoUrl: project.githubRepoUrl || "",
    });
    setShowModal(true);
  };

  const generateDescription = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a project name first");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await API.post("/ai/project-description", {
        name: form.name,
      });
      setForm((prev) => ({ ...prev, description: data.description || "" }));
    } catch (err) {
      toast.error("AI description failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, {
          status: form.status,
          description: form.description,
          githubRepoUrl: form.githubRepoUrl,
        });
        toast.success("Project updated");
      } else {
        await API.post("/projects", {
          ...form,
        });
        toast.success("Project created");
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await API.delete(`/projects/${id}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const columns = [
    { header: "Project Name", accessor: "name" },
    {
      header: "Description",
      render: (row) => row.description?.substring(0, 50) || "No description",
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
        <span className={`status-badge ${row.status?.toLowerCase().replace(/ /g, "-")}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Manager",
      render: (row) => row.manager?.name || "N/A",
    },
    {
      header: "Team Size",
      render: (row) => `${row.team?.length || 0} members`,
    },
  ];

  const statusSelect = (
    <select name="status" value={form.status} onChange={handleChange}>
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Project Management</h2>
        <button className="add-btn" onClick={openCreate}>
          + Create Project
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
            <button className="action-btn delete" onClick={() => handleDelete(row._id)}>
              Delete
            </button>
          </>
        )}
      />

      {showModal && (
        <div className="ft-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3>{editingProject ? "Edit Project" : "Create New Project"}</h3>
              <button className="ft-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="ft-modal-form">
              <div className="ft-modal-body">
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
              </div>

              <div className="ft-modal-footer">
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