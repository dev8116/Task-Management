const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// GET /api/analytics/productivity/:userId/weekly
const getWeeklyProductivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === userId;
    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    // Build per-day task completion counts for the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d);
    }

    const data = await Promise.all(
      days.map(async (day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const [completed, total] = await Promise.all([
          Task.countDocuments({
            assignedTo: userId,
            status: 'completed',
            updatedAt: { $gte: dayStart, $lte: dayEnd },
          }),
          Task.countDocuments({
            assignedTo: userId,
            createdAt: { $lte: dayEnd },
            status: { $ne: 'completed' },
          }),
        ]);

        return {
          date: day.toISOString().slice(0, 10),
          completed,
          pending: total,
        };
      })
    );

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/task-completion
const getTaskCompletion = async (req, res, next) => {
  try {
    const [total, completed, inProgress, pending] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'in-progress' }),
      Task.countDocuments({ status: 'pending' }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, completed, inProgress, pending },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/attendance-stats?month=M&year=YYYY
const getAttendanceStats = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const stats = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { present: 0, absent: 0, 'half-day': 0, late: 0 };
    stats.forEach((s) => {
      result[s._id] = s.count;
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/performance-ranking
const getPerformanceRanking = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email department');

    const rankings = await Promise.all(
      employees.map(async (emp) => {
        const [totalTasks, completedTasks] = await Promise.all([
          Task.countDocuments({ assignedTo: emp._id }),
          Task.countDocuments({ assignedTo: emp._id, status: 'completed' }),
        ]);

        const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          totalTasks,
          completedTasks,
          score,
        };
      })
    );

    rankings.sort((a, b) => b.score - a.score);

    return res.status(200).json({ success: true, data: rankings });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/team/:managerId
const getTeamAnalytics = async (req, res, next) => {
  try {
    const { managerId } = req.params;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === managerId;

    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find projects managed by this manager
    const Project = require('../models/Project');
    const projects = await Project.find({ managerId }).select('_id projectName');
    const projectIds = projects.map((p) => p._id);

    const [totalTasks, completedTasks, inProgressTasks, pendingTasks] = await Promise.all([
      Task.countDocuments({ projectId: { $in: projectIds } }),
      Task.countDocuments({ projectId: { $in: projectIds }, status: 'completed' }),
      Task.countDocuments({ projectId: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({ projectId: { $in: projectIds }, status: 'pending' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        projects: projects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWeeklyProductivity,
  getTaskCompletion,
  getAttendanceStats,
  getPerformanceRanking,
  getTeamAnalytics,
};
