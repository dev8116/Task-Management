const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @desc    Get dashboard stats
// @route   GET /api/reports/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'admin') {
      stats = {
        totalEmployees: await User.countDocuments({ role: 'employee' }),
        totalManagers: await User.countDocuments({ role: 'manager' }),
        totalProjects: await Project.countDocuments(),
        totalTasks: await Task.countDocuments(),
        completedTasks: await Task.countDocuments({ status: 'Completed' }),
        pendingTasks: await Task.countDocuments({ status: 'Pending' }),
        inProgressTasks: await Task.countDocuments({ status: 'In Progress' }),
        pendingLeaves: await Leave.countDocuments({ status: 'Pending' }),
      };
    } else if (req.user.role === 'manager') {
      // Manager-specific stats
      const managerProjects = await Project.find({ manager: req.user._id }).select('_id');
      const projectIds = managerProjects.map((p) => p._id);
      const teamMembers = await User.countDocuments({ manager: req.user._id, role: 'employee' });

      stats = {
        assignedProjects: managerProjects.length,
        teamMembers,
        totalTasks: await Task.countDocuments({ project: { $in: projectIds } }),
        completedTasks: await Task.countDocuments({ project: { $in: projectIds }, status: 'Completed' }),
        pendingTasks: await Task.countDocuments({ project: { $in: projectIds }, status: 'Pending' }),
        inProgressTasks: await Task.countDocuments({ project: { $in: projectIds }, status: 'In Progress' }),
        pendingLeaves: await Leave.countDocuments({ status: 'Pending' }),
      };
    } else {
      // Employee stats
      stats = {
        totalTasks: await Task.countDocuments({ assignedTo: req.user._id }),
        completedTasks: await Task.countDocuments({ assignedTo: req.user._id, status: 'Completed' }),
        pendingTasks: await Task.countDocuments({ assignedTo: req.user._id, status: 'Pending' }),
        inProgressTasks: await Task.countDocuments({ assignedTo: req.user._id, status: 'In Progress' }),
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project progress report
// @route   GET /api/reports/projects
exports.getProjectReport = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'manager') {
      query.manager = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('manager', 'name')
      .select('name status progress startDate endDate manager');

    const report = [];
    for (let project of projects) {
      const totalTasks = await Task.countDocuments({ project: project._id });
      const completedTasks = await Task.countDocuments({ project: project._id, status: 'Completed' });
      report.push({
        _id: project._id,
        name: project.name,
        manager: project.manager?.name || 'N/A',
        status: project.status,
        progress: project.progress,
        totalTasks,
        completedTasks,
        startDate: project.startDate,
        endDate: project.endDate,
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee performance report
// @route   GET /api/reports/performance
exports.getPerformanceReport = async (req, res) => {
  try {
    let empQuery = { role: 'employee' };

    // Manager can only see their team's performance
    if (req.user.role === 'manager') {
      empQuery.manager = req.user._id;
    }

    const employees = await User.find(empQuery).select('name email department');
    const report = [];

    for (let emp of employees) {
      const totalTasks = await Task.countDocuments({ assignedTo: emp._id });
      const completedTasks = await Task.countDocuments({ assignedTo: emp._id, status: 'Completed' });
      const overdueTasks = await Task.countDocuments({
        assignedTo: emp._id,
        status: { $ne: 'Completed' },
        deadline: { $lt: new Date() },
      });
      const totalAttendance = await Attendance.countDocuments({ user: emp._id, status: 'Present' });

      report.push({
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalAttendance,
      });
    }

    report.sort((a, b) => b.completionRate - a.completionRate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task completion summary
// @route   GET /api/reports/tasks-summary
exports.getTaskSummary = async (req, res) => {
  try {
    let taskQuery = {};

    if (req.user.role === 'manager') {
      const managerProjects = await Project.find({ manager: req.user._id }).select('_id');
      const projectIds = managerProjects.map((p) => p._id);
      taskQuery.project = { $in: projectIds };
    } else if (req.user.role === 'employee') {
      taskQuery.assignedTo = req.user._id;
    }

    const pending = await Task.countDocuments({ ...taskQuery, status: 'Pending' });
    const inProgress = await Task.countDocuments({ ...taskQuery, status: 'In Progress' });
    const completed = await Task.countDocuments({ ...taskQuery, status: 'Completed' });
    const overdue = await Task.countDocuments({
      ...taskQuery,
      status: { $ne: 'Completed' },
      deadline: { $lt: new Date() },
    });

    // Weekly data
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCompleted = await Task.countDocuments({
        ...taskQuery,
        status: 'Completed',
        completedAt: {
          $gte: new Date(dateStr),
          $lt: new Date(new Date(dateStr).getTime() + 86400000),
        },
      });

      weeklyData.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayCompleted,
      });
    }

    res.json({ pending, inProgress, completed, overdue, weeklyData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my performance (Employee)
// @route   GET /api/reports/my-performance
exports.getMyPerformance = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ assignedTo: req.user._id });
    const completedTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'In Progress' });
    const overdueTasks = await Task.countDocuments({
      assignedTo: req.user._id,
      status: { $ne: 'Completed' },
      deadline: { $lt: new Date() },
    });

    const totalAttendance = await Attendance.countDocuments({ user: req.user._id });
    const presentDays = await Attendance.countDocuments({ user: req.user._id, status: 'Present' });

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalAttendance,
      presentDays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};