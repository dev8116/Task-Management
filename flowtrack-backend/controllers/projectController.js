const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all projects
// @route   GET /api/projects
exports.getAllProjects = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager') {
      query.manager = req.user._id;
    } else if (req.user.role === 'employee') {
      query.team = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email')
      .populate('team', 'name email department')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email')
      .populate('team', 'name email department')
      .populate('createdBy', 'name');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');

    res.json({ project, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, status, priority, startDate, endDate, manager, team } = req.body;

    // Auto-populate team with manager's team members if no team specified
    let projectTeam = team || [];
    if (manager && projectTeam.length === 0) {
      const managerDoc = await User.findById(manager);
      if (managerDoc && managerDoc.teamMembers) {
        projectTeam = managerDoc.teamMembers;
      }
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
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_PROJECT',
      description: `Created project "${project.name}" and assigned to manager`,
      entity: 'Project',
      entityId: project._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('manager', 'name email')
      .populate('team', 'name email department');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If manager changed, auto-update team
    if (req.body.manager && req.body.manager !== project.manager.toString()) {
      const newManager = await User.findById(req.body.manager);
      if (newManager && newManager.teamMembers) {
        req.body.team = newManager.teamMembers;
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name email')
      .populate('team', 'name email department');

    // Recalculate progress
    const tasks = await Task.find({ project: project._id });
    if (tasks.length > 0) {
      const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
      updatedProject.progress = Math.round((completedTasks / tasks.length) * 100);
      await updatedProject.save();
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE_PROJECT',
      description: `Updated project "${updatedProject.name}"`,
      entity: 'Project',
      entityId: updatedProject._id,
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Task.deleteMany({ project: project._id });

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_PROJECT',
      description: `Deleted project "${project.name}"`,
      entity: 'Project',
      entityId: project._id,
    });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project and related tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};