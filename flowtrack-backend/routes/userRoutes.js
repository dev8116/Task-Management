const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getTeamMembers,
  getMyTeam,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ─── Profile Routes (any authenticated user) ───────────────────────────────
router.get('/profile/me', protect, getMyProfile);
router.put('/update-profile', protect, updateMyProfile);

// ─── Admin / Manager Routes ─────────────────────────────────────────────────
router.get('/', protect, authorize('admin', 'manager'), getAllUsers);
router.get('/my-team', protect, authorize('manager'), getMyTeam);
router.get('/team/:managerId', protect, authorize('admin', 'manager'), getTeamMembers);
router.get('/:id', protect, authorize('admin', 'manager'), getUser);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;