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

  // Selfie verification APIs
  getSelfieCheckRequirement,
  submitSelfieCheck,
  skipSelfieCheck,
  checkMissedSelfieDeadlines,
} = require('../controllers/attendanceController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const faceUpload = require('../middleware/faceUpload');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

// Overtime endpoints
router.post('/overtime-check-in', protect, overtimeCheckIn);
router.post('/overtime-check-out', protect, overtimeCheckOut);

// Face match endpoints
router.post('/face-check-in', protect, faceUpload.single('selfie'), faceCheckIn);
router.post('/face-check-out', protect, faceUpload.single('selfie'), faceCheckOut);

// ✅ Selfie Verification (Employee + Manager)
router.get('/selfie-check', protect, authorize('employee', 'manager'), getSelfieCheckRequirement);
router.post('/selfie-check/:checkId', protect, authorize('employee', 'manager'), faceUpload.single('selfie'), submitSelfieCheck);
router.post('/selfie-check/:checkId/skip', protect, authorize('employee', 'manager'), skipSelfieCheck);
router.get('/selfie-check/missed', protect, authorize('employee', 'manager'), checkMissedSelfieDeadlines);

router.get('/', protect, getAttendance);
router.get('/today', protect, getTodayAttendance);

module.exports = router;