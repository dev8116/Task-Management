const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get tasks
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    let query = {};
    const { project, status, priority, assignedTo } = req.query;

    if (req.user.role === 'employee') {
      // Employee sees only their own tasks
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager sees tasks from their projects only
      const managerProjects = await Project.find({ manager: req.user._id }).select('_id');
      const projectIds = managerProjects.map((p) => p._id);
      query.project = { $in: projectIds };
    }
    // Admin sees all tasks (no filter)

    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, deadline } = req.body;

    // Verify manager can only assign to their team members
    if (req.user.role === 'manager') {
      const employee = await User.findById(assignedTo);
      if (!employee || employee.manager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You can only assign tasks to employees in your team',
        });
      }

      // Verify project belongs to this manager
      const proj = await Project.findById(project);
      if (!proj || proj.manager.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You can only create tasks in your assigned projects',
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      deadline,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE_TASK',
      description: `Created task "${task.title}" and assigned to employee`,
      entity: 'Task',
      entityId: task._id,
    });

    // Update project progress
    await updateProjectProgress(project);

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Employee can only update status of their own tasks
    if (req.user.role === 'employee') {
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own tasks' });
      }
      // Employee can only update status
      const allowedFields = ['status'];
      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });

      if (updateData.status === 'Completed') {
        updateData.completedAt = new Date();
      }

      const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
        .populate('project', 'name')
        .populate('assignedTo', 'name email department')
        .populate('assignedBy', 'name');

      await ActivityLog.create({
        user: req.user._id,
        action: 'UPDATE_TASK',
        description: `Updated task "${updatedTask.title}" status to ${updatedTask.status}`,
        entity: 'Task',
        entityId: updatedTask._id,
      });

      await updateProjectProgress(updatedTask.project._id || updatedTask.project);
      return res.json(updatedTask);
    }

    // Manager and Admin can update all fields
    if (req.body.status === 'Completed' && task.status !== 'Completed') {
      req.body.completedAt = new Date();
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name');

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE_TASK',
      description: `Updated task "${updatedTask.title}" - Status: ${updatedTask.status}`,
      entity: 'Task',
      entityId: updatedTask._id,
    });

    await updateProjectProgress(updatedTask.project._id || updatedTask.project);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const projectId = task.project;

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE_TASK',
      description: `Deleted task "${task.title}"`,
      entity: 'Task',
      entityId: task._id,
    });

    await Task.findByIdAndDelete(req.params.id);
    await updateProjectProgress(projectId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: update project progress
const updateProjectProgress = async (projectId) => {
  try {
    const tasks = await Task.find({ project: projectId });
    if (tasks.length > 0) {
      const completed = tasks.filter((t) => t.status === 'Completed').length;
      const progress = Math.round((completed / tasks.length) * 100);
      await Project.findByIdAndUpdate(projectId, { progress });
    } else {
      await Project.findByIdAndUpdate(projectId, { progress: 0 });
    }
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};