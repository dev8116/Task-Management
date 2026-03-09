const express = require('express');
const { body } = require('express-validator');
const {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  getLeavesByUser,
  getLeaveBalance,
  approveLeave,
  rejectLeave,
  updateLeave,
  cancelLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/apply',
  protect,
  [
    body('leaveType')
      .isIn(['sick', 'casual', 'annual', 'unpaid'])
      .withMessage('Invalid leave type'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('reason').notEmpty().withMessage('Reason required'),
  ],
  applyLeave
);

// Root POST for leaves (frontend uses POST /leaves)
router.post(
  '/',
  protect,
  [
    body('leaveType')
      .isIn(['sick', 'casual', 'annual', 'unpaid'])
      .withMessage('Invalid leave type'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('reason').notEmpty().withMessage('Reason required'),
  ],
  applyLeave
);

// NOTE: specific named routes must come before parameterised routes
router.get('/my-leaves', protect, getMyLeaves);
router.get('/', protect, authorizeRoles('admin', 'manager'), getAllLeaves);

// PATCH approve/reject — frontend uses PATCH /leaves/:id/approve and /leaves/:id/reject
router.patch('/:id/approve', protect, authorizeRoles('admin', 'manager'), approveLeave);
router.patch('/:id/reject', protect, authorizeRoles('admin', 'manager'), rejectLeave);

// PUT for approve/reject (problem statement style)
router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'manager'),
  [
    body('status')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be "approved" or "rejected"'),
  ],
  updateLeave
);

router.delete('/:id', protect, cancelLeave);

// NOTE: /:userId/balance must be declared before /:userId to prevent 'balance'
// from being interpreted as a userId by Express's route matching.
router.get('/:userId/balance', protect, getLeaveBalance);
router.get('/:userId', protect, getLeavesByUser);

module.exports = router;
