const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const {
  createTask,
  getAllTasks,
  getMyTasks,
  getTasksByProject,
  getTasksByAssignee,
  getTaskById,
  updateTask,
  deleteTask,
  uploadAttachment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Multer config for task attachments
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// NOTE: specific routes must come before parameterised routes
router.get('/my-tasks', protect, getMyTasks);
router.get('/project/:projectId', protect, getTasksByProject);
router.get('/assignee/:userId', protect, getTasksByAssignee);

router.post(
  '/',
  protect,
  authorizeRoles('admin', 'manager'),
  upload.array('attachments', 10),
  [
    body('title').notEmpty().withMessage('Title required'),
    body('projectId').notEmpty().withMessage('Project ID required'),
    body('assignedTo').notEmpty().withMessage('Assigned user required'),
    body('deadline').isISO8601().withMessage('Valid deadline required'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed'])
      .withMessage('Invalid status'),
  ],
  createTask
);

router.get('/', protect, authorizeRoles('admin', 'manager'), getAllTasks);

router.get('/:id', protect, getTaskById);

router.put(
  '/:id',
  protect,
  [
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed'])
      .withMessage('Invalid status'),
    body('deadline').optional().isISO8601().withMessage('Valid deadline required'),
  ],
  updateTask
);

router.delete('/:id', protect, authorizeRoles('admin', 'manager'), deleteTask);

router.post('/:id/upload-attachment', protect, upload.array('attachments', 10), uploadAttachment);

module.exports = router;
