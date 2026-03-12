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
    }

    if (req.user.role === 'employee') {
      query.team = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email')
      .populate('team', 'name email department')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });


    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {

        const totalTasks = await Task.countDocuments({
          project: project._id
        });

        const completedTasks = await Task.countDocuments({
          project: project._id,
          status: { $in: ['Completed', 'completed', 'Done'] }
        });

        let progress = 0;

        if (totalTasks > 0) {
          progress = Math.round((completedTasks / totalTasks) * 100);
        }

        return {
          ...project.toObject(),
          progress,
          totalTasks,
          completedTasks
        };
      })
    );

    res.json(projectsWithProgress);

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


    const completedTasks = tasks.filter(
      (t) => ['Completed', 'completed', 'Done'].includes(t.status)
    ).length;

    const progress =
      tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    res.json({
      project: {
        ...project.toObject(),
        progress
      },
      tasks
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Create project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {

    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      manager,
      team
    } = req.body;


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
      createdBy: req.user._id
    });


    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_PROJECT',
      description: `Created project "${project.name}"`,
      entity: 'Project',
      entityId: project._id
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


    if (req.body.manager && req.body.manager !== project.manager.toString()) {

      const newManager = await User.findById(req.body.manager);

      if (newManager && newManager.teamMembers) {
        req.body.team = newManager.teamMembers;
      }
    }


    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('manager', 'name email')
      .populate('team', 'name email department');


    const totalTasks = await Task.countDocuments({
      project: project._id
    });

    const completedTasks = await Task.countDocuments({
      project: project._id,
      status: { $in: ['Completed', 'completed', 'Done'] }
    });

    let progress = 0;

    if (totalTasks > 0) {
      progress = Math.round((completedTasks / totalTasks) * 100);
    }

    updatedProject.progress = progress;
    await updatedProject.save();


    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE_PROJECT',
      description: `Updated project "${updatedProject.name}"`,
      entity: 'Project',
      entityId: updatedProject._id
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


    await Task.deleteMany({
      project: project._id
    });


    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_PROJECT',
      description: `Deleted project "${project.name}"`,
      entity: 'Project',
      entityId: project._id
    });


    await Project.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Project and related tasks deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};