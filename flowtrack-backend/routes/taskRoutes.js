const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  submitCompletion,
  reviewSubmission,
  getSubmissionFile,
  updateChecklist, 
  updateSubtasks,
} = require("../controllers/taskController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

// ── Basic CRUD ───────────────────────────────────────────────
router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.post("/", protect, authorize("admin", "manager"), createTask);
router.put("/:id", protect, authorize("admin", "manager"), updateTask);
router.delete("/:id", protect, authorize("admin", "manager"), deleteTask);

// ── Employee: toggle pending ↔ in-progress ───────────────────
router.patch("/:id/status", protect, authorize("employee"), updateTaskStatus);

// ── Employee: submit completion with file upload ─────────────
router.post(
  "/:id/submit-completion",
  protect,
  authorize("employee"),
  upload.single("submissionFile"),
  submitCompletion
);

// ── Manager/Admin: approve or reject submission ──────────────
router.patch("/:id/review-submission", protect, authorize("manager", "admin"), reviewSubmission);

// ── Manager/Admin: view/download submission file ─────────────
router.get("/:id/submission-file", protect, authorize("manager", "admin"), getSubmissionFile);

// ── Checklist / Subtasks (employee + manager + admin) ───────
router.patch("/:id/checklist", protect, authorize("employee", "manager", "admin"), updateChecklist);
router.patch("/:id/subtasks", protect, authorize("employee", "manager", "admin"), updateSubtasks);

module.exports = router;