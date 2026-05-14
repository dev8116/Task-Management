const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

router.post("/", protect, authorize("admin", "manager"), createGoal);
router.get("/", protect, getGoals);
router.get("/:id", protect, getGoalById);
router.put("/:id", protect, authorize("admin", "manager"), updateGoal);
router.delete("/:id", protect, authorize("admin", "manager"), deleteGoal);

module.exports = router;