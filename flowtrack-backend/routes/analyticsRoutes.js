const express = require('express');
const {
  getWeeklyProductivity,
  getTaskCompletion,
  getAttendanceStats,
  getPerformanceRanking,
  getTeamAnalytics,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/productivity/:userId/weekly', protect, getWeeklyProductivity);
router.get('/task-completion', protect, authorizeRoles('admin', 'manager'), getTaskCompletion);
router.get('/attendance-stats', protect, authorizeRoles('admin', 'manager'), getAttendanceStats);
router.get(
  '/performance-ranking',
  protect,
  authorizeRoles('admin', 'manager'),
  getPerformanceRanking
);
router.get('/team/:managerId', protect, authorizeRoles('admin', 'manager'), getTeamAnalytics);

module.exports = router;
