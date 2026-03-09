const cron = require('node-cron');
const Task = require('../models/Task');
const logActivity = require('./activityLogger');

const startReminderScheduler = () => {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingTasks = await Task.find({
        deadline: { $gte: now, $lte: in24Hours },
        status: { $ne: 'completed' },
      }).populate('assignedTo', 'name email');

      for (const task of upcomingTasks) {
        if (task.assignedTo) {
          await logActivity(
            task.assignedTo._id,
            'DEADLINE_REMINDER',
            `Task "${task.title}" is due within 24 hours (deadline: ${task.deadline.toISOString()})`,
            null
          );
          // In production: trigger email/push notification here
          console.log(
            `[Reminder] Task "${task.title}" due soon for ${task.assignedTo.name}`
          );
        }
      }
    } catch (err) {
      console.error('[ReminderScheduler] Error:', err.message);
    }
  });

  console.log('[ReminderScheduler] Daily deadline reminder job scheduled (8:00 AM)');
};

module.exports = startReminderScheduler;
