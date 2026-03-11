const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getProjectReport,
  getPerformanceReport,
  getTaskSummary,
  getMyPerformance,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/projects', protect, authorize('admin', 'manager'), getProjectReport);
router.get('/performance', protect, authorize('admin', 'manager'), getPerformanceReport);
router.get('/tasks-summary', protect, getTaskSummary);
router.get('/my-performance', protect, getMyPerformance);

module.exports = router;