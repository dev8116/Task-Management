const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  authorizeRoles('admin', 'manager'),
  [
    body('projectName').notEmpty().withMessage('Project name required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('deadline').isISO8601().withMessage('Valid deadline required'),
  ],
  createProject
);

router.get('/', protect, authorizeRoles('admin', 'manager'), getAllProjects);

router.get('/:id', protect, getProjectById);

router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'manager'),
  [
    body('projectName').optional().notEmpty().withMessage('Project name cannot be empty'),
    body('startDate').optional().isISO8601().withMessage('Valid start date required'),
    body('deadline').optional().isISO8601().withMessage('Valid deadline required'),
    body('progress')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress must be 0-100'),
    body('status')
      .optional()
      .isIn(['planning', 'active', 'on-hold', 'completed'])
      .withMessage('Invalid status'),
  ],
  updateProject
);

router.delete('/:id', protect, authorizeRoles('admin'), deleteProject);

module.exports = router;
