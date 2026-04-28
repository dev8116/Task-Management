import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ProjectStatusSelect from "./ProjectStatusSelect";

const ProjectForm = ({ project, onSaved, onCancel }) => {
  const { user } = useAuth();
  const isEdit = Boolean(project?._id);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "Planning",
    priority: project?.priority || "medium",
    manager: project?.manager?._id || "",
    startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
    endDate: project?.endDate ? project.endDate.slice(0, 10) : "",
  });

  useEffect(() => {
    API.get("/users?role=manager").then(({ data }) => setManagers(data || []));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await API.put(`/projects/${project._id}`, form);
      } else {
        await API.post("/projects", form);
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save project");
    }
  };

  const isEmployee = user.role === "employee";

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <label>Project Name</label>
      <input name="name" value={form.name} onChange={handleChange} disabled={isEmployee} required />

      <label>Description</label>
      <textarea name="description" value={form.description} onChange={handleChange} disabled={isEmployee} />

      <label>Status</label>
      <ProjectStatusSelect
        role={user.role}
        value={form.status}
        onChange={handleChange}
        disabled={isEmployee}
      />

      <label>Priority</label>
      <select name="priority" value={form.priority} onChange={handleChange} disabled={isEmployee}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <label>Manager</label>
      <select
        name="manager"
        value={form.manager}
        onChange={handleChange}
        disabled={user.role !== "admin"} // managers cannot reassign ownership
      >
        <option value="">-- Select Manager --</option>
        {managers.map((m) => (
          <option key={m._id} value={m._id}>{m.name}</option>
        ))}
      </select>

      <label>Start Date</label>
      <input type="date" name="startDate" value={form.startDate} onChange={handleChange} disabled={isEmployee} />
      <label>End Date</label>
      <input type="date" name="endDate" value={form.endDate} onChange={handleChange} disabled={isEmployee} />

      <div className="actions">
        <button type="submit" disabled={isEmployee}>{isEdit ? "Update" : "Create"} Project</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default ProjectForm;