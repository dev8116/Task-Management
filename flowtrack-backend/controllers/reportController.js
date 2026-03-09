const Task = require('../models/Task');
const Project = require('../models/Project');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// GET /api/reports/task-summary — tasks grouped by projectId + status
const taskSummary = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { projectId: '$projectId', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id.projectId',
          foreignField: '_id',
          as: 'project',
        },
      },
      { $unwind: { path: '$project', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 0,
          projectId: '$_id.projectId',
          projectName: '$project.projectName',
          status: '$_id.status',
          count: 1,
        },
      },
      { $sort: { projectName: 1, status: 1 } },
    ];

    const data = await Task.aggregate(pipeline);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/project-progress
const projectProgress = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('managerId', 'name email')
      .sort({ deadline: 1 });

    const now = new Date();
    const data = projects.map((p) => ({
      _id: p._id,
      projectName: p.projectName,
      manager: p.managerId,
      status: p.status,
      progress: p.progress,
      deadline: p.deadline,
      startDate: p.startDate,
      daysLeft: Math.ceil((new Date(p.deadline) - now) / MS_PER_DAY),
      isOverdue: p.deadline < now && p.status !== 'completed',
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/employee-performance
const employeePerformance = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email department');

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const performanceData = await Promise.all(
      employees.map(async (emp) => {
        const [totalTasks, completedTasks, attendanceRecords, leavesCount] = await Promise.all([
          Task.countDocuments({ assignedTo: emp._id }),
          Task.countDocuments({ assignedTo: emp._id, status: 'completed' }),
          Attendance.find({
            employeeId: emp._id,
            date: { $gte: yearStart },
            status: { $in: ['present', 'late', 'half-day'] },
          }),
          Leave.countDocuments({
            employeeId: emp._id,
            status: 'approved',
            startDate: { $gte: yearStart },
          }),
        ]);

        const workingDaysSoFar = Math.ceil((new Date() - yearStart) / MS_PER_DAY);
        const attendancePct =
          workingDaysSoFar > 0
            ? Math.round((attendanceRecords.length / workingDaysSoFar) * 100)
            : 0;

        const taskCompletionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          employee: { _id: emp._id, name: emp.name, email: emp.email, department: emp.department },
          totalTasks,
          completedTasks,
          taskCompletionRate,
          attendanceDays: attendanceRecords.length,
          attendancePercentage: attendancePct,
          leavesTaken: leavesCount,
        };
      })
    );

    return res.status(200).json({ success: true, data: performanceData });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/activity-logs — paginated
const activityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');

    const [data, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'name email role')
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 }),
      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { taskSummary, projectProgress, employeePerformance, activityLogs };
