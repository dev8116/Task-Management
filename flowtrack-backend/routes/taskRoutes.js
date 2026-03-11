const express = require("express");
const router  = express.Router();
const {
  getTasks, getTaskById, createTask,
  updateTask, updateTaskStatus, deleteTask,
  submitCompletion, reviewSubmission, getSubmissionFile,
} = require("../controllers/taskController");

// ✅ Use YOUR actual middleware file names
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload        = require("../middleware/upload");

// ── Basic CRUD ───────────────────────────────────────────────
router.get("/",    protect, getTasks);
router.get("/:id", protect, getTaskById);
router.post("/",   protect, authorize("admin", "manager"), createTask);
router.put("/:id", protect, authorize("admin", "manager"), updateTask);
router.delete("/:id", protect, authorize("admin", "manager"), deleteTask);

// ── Employee: toggle pending ↔ in-progress ───────────────────
router.patch("/:id/status", protect, authorize("employee"), updateTaskStatus);

// ── Employee: submit completion with file upload ─────────────
router.post("/:id/submit-completion", protect, authorize("employee"), upload.single("submissionFile"), submitCompletion);

// ── Manager: approve or reject submission ────────────────────
router.patch("/:id/review-submission", protect, authorize("manager"), reviewSubmission);

// ── Manager: view/download submission file ───────────────────
router.get("/:id/submission-file", protect, authorize("manager"), getSubmissionFile);

module.exports = router;