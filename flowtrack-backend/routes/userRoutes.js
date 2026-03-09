const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const {
  getAllUsers,
  createUser,
  getProfile,
  updateProfile,
  getUserById,
  updateUser,
  deleteUser,
  uploadAvatar,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for avatars'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Profile routes (before /:id to avoid shadowing)
router.get('/profile', protect, getProfile);
router.put(
  '/profile',
  protect,
  [body('name').optional().notEmpty().withMessage('Name cannot be empty')],
  updateProfile
);

// Admin-only user management
router.get('/', protect, authorizeRoles('admin'), getAllUsers);
router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'employee'])
      .withMessage('Invalid role'),
  ],
  createUser
);

router.get('/:id', protect, getUserById);
router.put(
  '/:id',
  protect,
  authorizeRoles('admin'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'employee'])
      .withMessage('Invalid role'),
  ],
  updateUser
);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);
router.post('/:id/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
