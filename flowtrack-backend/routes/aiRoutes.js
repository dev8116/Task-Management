const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateProjectDescription,
  generateTaskSuggestion,
} = require("../controllers/aiController");

router.post("/project-description", protect, generateProjectDescription);
router.post("/task-suggestion", protect, generateTaskSuggestion);

module.exports = router;