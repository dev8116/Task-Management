const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActivityLogs);

module.exports = router;