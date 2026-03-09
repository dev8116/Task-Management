const express = require('express');
const {
  checkIn,
  checkOut,
  getAttendanceByDate,
  getTodayAll,
  getAttendanceByEmployee,
  getMonthlyAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

// NOTE: specific routes must come before parameterised /:employeeId
router.get('/by-date', protect, authorizeRoles('admin', 'manager'), getAttendanceByDate);
router.get('/today/all', protect, authorizeRoles('admin', 'manager'), getTodayAll);

router.get('/:employeeId/monthly', protect, getMonthlyAttendance);
router.get('/:employeeId', protect, getAttendanceByEmployee);

module.exports = router;
