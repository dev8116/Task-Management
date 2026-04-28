const User       = require('../models/User');
const Project    = require('../models/Project');
const Task       = require('../models/Task');
const Attendance = require('../models/Attendance');
const Leave      = require('../models/Leave');

// ── helper: build task query for any role ─────────────────────
const buildTaskQuery = async (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'manager') {
    const teamEmployees = await User.find({ manager: user._id, role: 'employee' }).select('_id');
    const empIds = teamEmployees.map((e) => e._id);
    return {
      $or: [
        { createdBy:         user._id },
        { assignedManager:   user._id },
        { assignedTo:        { $in: empIds } },
        { assignedEmployees: { $in: empIds } },
      ],
    };
  }
  return {
    $or: [
      { assignedTo:        user._id },
      { assignedEmployees: user._id },
    ],
  };
};

// ── GET /api/reports/dashboard ────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'admin') {
      stats = {
        totalUsers:      await User.countDocuments({ role: { $in: ['employee', 'manager'] } }),
        totalEmployees:  await User.countDocuments({ role: 'employee' }),
        totalManagers:   await User.countDocuments({ role: 'manager' }),
        totalProjects:   await Project.countDocuments(),
        totalTasks:      await Task.countDocuments(),
        completedTasks:  await Task.countDocuments({ status: 'completed' }),
        pendingTasks:    await Task.countDocuments({ status: 'pending' }),
        inProgressTasks: await Task.countDocuments({ status: 'in-progress' }),
        overdueTasks:    await Task.countDocuments({
          status: { $nin: ['completed', 'pending-approval'] },
          $or: [{ dueDate: { $lt: new Date() } }, { deadline: { $lt: new Date() } }],
        }),
        pendingLeaves: await Leave.countDocuments({ status: 'Pending' }),
      };

    } else if (req.user.role === 'manager') {
      const taskQuery   = await buildTaskQuery(req.user);
      const teamMembers = await User.countDocuments({ manager: req.user._id, role: 'employee' });
      const assignedProjects = await Project.countDocuments({
        $or: [{ manager: req.user._id }, { team: req.user._id }],
      });

      stats = {
        assignedProjects,
        teamMembers,
        totalTasks:      await Task.countDocuments(taskQuery),
        completedTasks:  await Task.countDocuments({ ...taskQuery, status: 'completed' }),
        pendingTasks:    await Task.countDocuments({ ...taskQuery, status: 'pending' }),
        inProgressTasks: await Task.countDocuments({ ...taskQuery, status: 'in-progress' }),
        overdueTasks:    await Task.countDocuments({
          ...taskQuery,
          status: { $nin: ['completed', 'pending-approval'] },
          $or: [{ dueDate: { $lt: new Date() } }, { deadline: { $lt: new Date() } }],
        }),
        pendingLeaves: await Leave.countDocuments({ status: 'Pending' }),
      };

    } else {
      const taskQuery = await buildTaskQuery(req.user);
      stats = {
        totalTasks:      await Task.countDocuments(taskQuery),
        completedTasks:  await Task.countDocuments({ ...taskQuery, status: 'completed' }),
        pendingTasks:    await Task.countDocuments({ ...taskQuery, status: 'pending' }),
        inProgressTasks: await Task.countDocuments({ ...taskQuery, status: 'in-progress' }),
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/reports/projects ─────────────────────────────────
exports.getProjectReport = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'manager') {
      query = { $or: [{ manager: req.user._id }, { team: req.user._id }] };
    }

    const projects = await Project.find(query)
      .populate('manager', 'name')
      .select('name status progress startDate endDate manager');

    const report = [];
    for (const project of projects) {

      // ✅ FIX: count with LOWERCASE status — matches Task model enum
      const totalTasks     = await Task.countDocuments({ project: project._id });
      const completedTasks = await Task.countDocuments({
        project: project._id,
        status:  'completed',   // ✅ lowercase — was 'Completed' before (always returned 0)
      });

      // ✅ FIX: calculate progress dynamically from real task counts
      // Do NOT use project.progress (stale static field from Project model)
      const calculatedProgress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      report.push({
        _id:               project._id,
        name:              project.name,
        manager:           project.manager?.name || 'N/A',
        status:            project.status,
        progress:          calculatedProgress,   // ✅ real-time from task counts
        storedProgress:    project.progress,     // kept for reference if needed
        totalTasks,
        completedTasks,
        startDate:         project.startDate,
        endDate:           project.endDate,
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/reports/performance ──────────────────────────────
exports.getPerformanceReport = async (req, res) => {
  try {
    let empQuery = { role: 'employee' };
    if (req.user.role === 'manager') empQuery.manager = req.user._id;

    const employees = await User.find(empQuery).select('name email department');
    const report    = [];

    for (const emp of employees) {
      // ✅ Check BOTH assignedTo and assignedEmployees
      const empTaskQ = {
        $or: [
          { assignedTo:        emp._id },
          { assignedEmployees: emp._id },
        ],
      };
      const totalTasks     = await Task.countDocuments(empTaskQ);
      const completedTasks = await Task.countDocuments({ ...empTaskQ, status: 'completed' });
      const overdueTasks   = await Task.countDocuments({
        ...empTaskQ,
        status: { $nin: ['completed', 'pending-approval'] },
        $or: [{ dueDate: { $lt: new Date() } }, { deadline: { $lt: new Date() } }],
      });
      const totalAttendance = await Attendance.countDocuments({ user: emp._id, status: 'Present' });

      report.push({
        _id:            emp._id,
        name:           emp.name,
        email:          emp.email,
        department:     emp.department,
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

// ── GET /api/reports/tasks-summary ───────────────────────────
exports.getTaskSummary = async (req, res) => {
  try {
    const taskQuery = await buildTaskQuery(req.user);

    const pending         = await Task.countDocuments({ ...taskQuery, status: 'pending' });
    const inProgress      = await Task.countDocuments({ ...taskQuery, status: 'in-progress' });
    const completed       = await Task.countDocuments({ ...taskQuery, status: 'completed' });
    const pendingApproval = await Task.countDocuments({ ...taskQuery, status: 'pending-approval' });
    const overdue         = await Task.countDocuments({
      ...taskQuery,
      status: { $nin: ['completed', 'pending-approval'] },
      $or: [{ dueDate: { $lt: new Date() } }, { deadline: { $lt: new Date() } }],
    });

    // Weekly data — last 7 days, use updatedAt (completedAt not in Task model)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date    = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayCompleted = await Task.countDocuments({
        ...taskQuery,
        status:    'completed',
        updatedAt: { $gte: date, $lt: nextDay },
      });

      weeklyData.push({
        date:      date.toISOString().split('T')[0],
        day:       date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayCompleted,
      });
    }

    res.json({ pending, inProgress, completed, pendingApproval, overdue, weeklyData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/reports/my-performance  (Employee) ──────────────
exports.getMyPerformance = async (req, res) => {
  try {
    const taskQuery = await buildTaskQuery(req.user);

    const totalTasks      = await Task.countDocuments(taskQuery);
    const completedTasks  = await Task.countDocuments({ ...taskQuery, status: 'completed' });
    const pendingTasks    = await Task.countDocuments({ ...taskQuery, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ ...taskQuery, status: 'in-progress' });
    const overdueTasks    = await Task.countDocuments({
      ...taskQuery,
      status: { $nin: ['completed', 'pending-approval'] },
      $or: [{ dueDate: { $lt: new Date() } }, { deadline: { $lt: new Date() } }],
    });

    const totalAttendance = await Attendance.countDocuments({ user: req.user._id });
    const presentDays     = await Attendance.countDocuments({ user: req.user._id, status: 'Present' });

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionRate:  totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalAttendance,
      presentDays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};