const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const logActivity = require('../utils/activityLogger');

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { title, description, projectId, assignedTo, priority, deadline, status } = req.body;

    const attachments = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      deadline,
      status,
      attachments,
    });

    await logActivity(req.user._id, 'CREATE_TASK', `Created task "${title}"`, req.ip);

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks — Admin, Manager; supports filter by projectId, assignedTo, status, priority
const getAllTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .populate('projectId', 'projectName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Task.countDocuments(filter),
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

// GET /api/tasks/my-tasks — current authenticated user's tasks
const getMyTasks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { assignedTo: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedBy', 'name email')
        .populate('projectId', 'projectName')
        .skip(skip)
        .limit(limit)
        .sort({ deadline: 1 }),
      Task.countDocuments(filter),
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

// GET /api/tasks/project/:projectId — tasks for a specific project
const getTasksByProject = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { projectId: req.params.projectId };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Task.countDocuments(filter),
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

// GET /api/tasks/assignee/:userId — tasks assigned to a specific user
const getTasksByAssignee = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { assignedTo: req.params.userId };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedBy', 'name email')
        .populate('projectId', 'projectName')
        .skip(skip)
        .limit(limit)
        .sort({ deadline: 1 }),
      Task.countDocuments(filter),
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

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('projectId', 'projectName');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isEmployee = req.user.role === 'employee';
    const updates = {};

    if (isEmployee) {
      // Employees can only update status of their own tasks
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.body.status !== undefined) updates.status = req.body.status;
    } else {
      // Admin/Manager can update all fields
      const allowed = ['title', 'description', 'assignedTo', 'priority', 'deadline', 'status'];
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('projectId', 'projectName');

    await logActivity(req.user._id, 'UPDATE_TASK', `Updated task "${updated.title}"`, req.ip);

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id — Admin, Manager
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await logActivity(req.user._id, 'DELETE_TASK', `Deleted task "${task.title}"`, req.ip);

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/:id/upload-attachment
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const newPaths = req.files.map((f) => `/uploads/${f.filename}`);
    task.attachments.push(...newPaths);
    await task.save();

    await logActivity(
      req.user._id,
      'UPLOAD_ATTACHMENT',
      `Uploaded ${req.files.length} attachment(s) to task "${task.title}"`,
      req.ip
    );

    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getMyTasks,
  getTasksByProject,
  getTasksByAssignee,
  getTaskById,
  updateTask,
  deleteTask,
  uploadAttachment,
};
