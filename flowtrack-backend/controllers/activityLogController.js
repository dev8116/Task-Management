const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/activity-logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { limit = 50, action, userId } = req.query;
    let query = {};

    if (action) query.action = action;
    if (userId) query.user = userId;
    if (req.user.role === 'employee') query.user = req.user._id;

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};