const Project = require("../models/Project");
const User = require("../models/User");
const Task = require("../models/Task");
const { notify, getRecipients } = require("../utils/notify");
const { updateProjectProgress } = require("../utils/projectProgress");
const { validateProjectStatusUpdate } = require("../utils/projectStatus");

// @desc Get all projects
// @route GET /api/projects
exports.getAllProjects = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "employee") {
      query.$or = [
        { team: req.user._id },
        { manager: req.user._id },
        { createdBy: req.user._id },
      ];
    } else if (req.user.role === "manager") {
      // Managers should see only projects assigned to them
      query.manager = req.user._id;
    }
    // Admin sees everything

    let projects = await Project.find(query)
      .populate("manager", "name email")
      .populate("team", "name email department")
      .sort({ createdAt: -1 })
      .lean();

    for (let i = 0; i < projects.length; i++) {
      const { progress } = await updateProjectProgress(projects[i]._id);
      projects[i].progress = progress;
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single project
// @route GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("manager", "name email")
      .populate("team", "name email department");

    if (!project) return res.status(404).json({ message: "Project not found" });

    await updateProjectProgress(project._id);
    const refreshed = await Project.findById(project._id)
      .populate("manager", "name email")
      .populate("team", "name email department");

    res.json(refreshed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create project (Admin only)
// @route POST /api/projects
exports.createProject = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create projects." });
    }

    const { name, description, status = "Planning", priority, startDate, endDate, manager } =
      req.body;
    let projectTeam = [];

    if (manager) {
      const managerDoc = await User.findById(manager);
      if (managerDoc?.teamMembers) projectTeam = managerDoc.teamMembers;
    }

    const project = await Project.create({
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      manager,
      team: projectTeam,
      createdBy: req.user._id,
      progress: 0,
    });

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(actorDoc, projectTeam.concat(manager ? [manager] : []));
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "CREATE_PROJECT",
      title: "Project created",
      description: `${actorDoc.name} created project "${project.name}"`,
      entity: "Project",
      entityId: project._id,
      recipients,
    });

    const populated = await Project.findById(project._id)
      .populate("manager", "name email")
      .populate("team", "name email department");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update project (Admin or assigned Manager)
// @route PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isAssignedManager =
      project.manager && project.manager.toString() === req.user._id.toString();

    if (req.user.role === "employee") {
      return res.status(403).json({ message: "Employees cannot update projects." });
    }

    const updateData = {};
    const { status: newStatus, description: newDescription } = req.body;

    if (req.user.role === "admin") {
      // Admin may close/cancel Planning and may edit description
      if (newStatus !== undefined) {
        if (project.status !== "Planning" || !["Closed", "Cancelled"].includes(newStatus)) {
          return res
            .status(403)
            .json({ message: "Admin is only allowed to close or cancel a Planning project." });
        }
        updateData.status = newStatus;
      }
      if (newDescription !== undefined) {
        updateData.description = newDescription;
      }
      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ message: "Nothing to update. Provide status or description to update." });
      }
    } else if (req.user.role === "manager") {
      if (!isAssignedManager) {
        return res.status(403).json({ message: "Managers can update only their own projects." });
      }
      const blockedAdminTransition =
        project.status === "Planning" && ["Closed", "Cancelled"].includes(newStatus);
      if (blockedAdminTransition) {
        return res.status(403).json({ message: "Only admin can close/cancel a Planning project." });
      }

      const allowedFields = ["name", "description", "priority", "startDate", "endDate", "status"];
      allowedFields.forEach((f) => {
        if (req.body[f] !== undefined) updateData[f] = req.body[f];
      });
    }

    // Validate status transition if status is being changed
    if (updateData.status !== undefined) {
      const { ok, message } = validateProjectStatusUpdate(
        req.user.role,
        project.status,
        updateData.status,
        isAssignedManager
      );
      if (!ok) return res.status(400).json({ message });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate("manager", "name email")
      .populate("team", "name email department");

    await updateProjectProgress(updatedProject._id);

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(
      actorDoc,
      updatedProject.team.map((t) => t._id).concat(updatedProject.manager ? [updatedProject.manager._id] : [])
    );
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "UPDATE_PROJECT",
      title: "Project updated",
      description: `${actorDoc.name} updated project "${updatedProject.name}"`,
      entity: "Project",
      entityId: updatedProject._id,
      recipients,
    });

    const refreshed = await Project.findById(updatedProject._id)
      .populate("manager", "name email")
      .populate("team", "name email department");

    res.json(refreshed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete project (Admin only)
// @route DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete projects." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await Task.deleteMany({ project: project._id });

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(
      actorDoc,
      project.team.concat(project.manager ? [project.manager] : [])
    );
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "DELETE_PROJECT",
      title: "Project deleted",
      description: `${actorDoc.name} deleted project "${project.name}"`,
      entity: "Project",
      entityId: project._id,
      recipients,
    });

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project and related tasks deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};