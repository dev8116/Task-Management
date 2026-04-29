const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

console.log("protect:", typeof protect);
console.log("aiController keys:", Object.keys(aiController));
console.log("generateProjectDescription:", typeof aiController.generateProjectDescription);
console.log("generateTaskSuggestion:", typeof aiController.generateTaskSuggestion);

router.post("/project-description", protect, aiController.generateProjectDescription);
router.post("/task-suggestion", protect, aiController.generateTaskSuggestion);

module.exports = router;