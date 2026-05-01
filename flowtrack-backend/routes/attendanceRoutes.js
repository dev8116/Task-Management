const express = require('express');
const router = express.Router();

const {
  checkIn,
  checkOut,
  getAttendance,
  getTodayAttendance,
  faceCheckIn,
  faceCheckOut,
  overtimeCheckIn,
  overtimeCheckOut,
} = require('../controllers/attendanceController');

const { protect } = require('../middleware/authMiddleware');
const faceUpload = require('../middleware/faceUpload');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

// Overtime endpoints
router.post('/overtime-check-in', protect, overtimeCheckIn);
router.post('/overtime-check-out', protect, overtimeCheckOut);

// Face match endpoints
router.post('/face-check-in', protect, faceUpload.single('selfie'), faceCheckIn);
router.post('/face-check-out', protect, faceUpload.single('selfie'), faceCheckOut);

router.get('/', protect, getAttendance);
router.get('/today', protect, getTodayAttendance);

module.exports = router;