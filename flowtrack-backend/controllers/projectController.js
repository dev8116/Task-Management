const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const logActivity = require('../utils/activityLogger');

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { projectName, description, managerId, assignedEmployees, startDate, deadline, status } =
      req.body;

    const project = await Project.create({
      projectName,
      description,
      managerId: managerId || req.user._id,
      assignedEmployees: assignedEmployees || [],
      startDate,
      deadline,
      status,
    });

    await logActivity(req.user._id, 'CREATE_PROJECT', `Created project "${projectName}"`, req.ip);

    return res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects
const getAllProjects = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.managerId) filter.managerId = req.query.managerId;

    const [data, total] = await Promise.all([
      Project.find(filter)
        .populate('managerId', 'name email')
        .populate('assignedEmployees', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Project.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('managerId', 'name email department')
      .populate('assignedEmployees', 'name email department');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    return res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Manager can only update their own project
    if (
      req.user.role === 'manager' &&
      project.managerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowed = [
      'projectName',
      'description',
      'managerId',
      'assignedEmployees',
      'startDate',
      'deadline',
      'status',
      'progress',
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('managerId', 'name email')
      .populate('assignedEmployees', 'name email');

    await logActivity(
      req.user._id,
      'UPDATE_PROJECT',
      `Updated project "${updated.projectName}"`,
      req.ip
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id — Admin only
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await logActivity(
      req.user._id,
      'DELETE_PROJECT',
      `Deleted project "${project.projectName}"`,
      req.ip
    );

    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProject, getAllProjects, getProjectById, updateProject, deleteProject };
