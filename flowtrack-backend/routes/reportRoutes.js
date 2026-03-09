const express = require('express');
const { taskSummary, projectProgress, employeePerformance, activityLogs } =
  require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/task-summary', protect, authorizeRoles('admin', 'manager'), taskSummary);
router.get('/project-progress', protect, authorizeRoles('admin', 'manager'), projectProgress);
router.get(
  '/employee-performance',
  protect,
  authorizeRoles('admin', 'manager'),
  employeePerformance
);
router.get('/activity-logs', protect, authorizeRoles('admin'), activityLogs);

module.exports = router;
