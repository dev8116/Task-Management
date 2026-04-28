const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, applyLeave);
router.get('/', protect, getLeaves);
router.put('/:id', protect, authorize('admin', 'manager'), updateLeaveStatus);

module.exports = router;