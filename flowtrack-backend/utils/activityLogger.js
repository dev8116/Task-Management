const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details, ipAddress) => {
  try {
    await ActivityLog.create({ userId, action, details, ipAddress });
  } catch (_err) {
    // Fail silently — activity logging should never break the main flow
  }
};

module.exports = logActivity;
