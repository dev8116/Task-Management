const express = require("express");
const router = express.Router();
const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Admin only: create, delete
router.post("/", protect, authorize("admin"), createProject);
router.delete("/:id", protect, authorize("admin"), deleteProject);

// Admin or Manager: update (controller enforces finer rules)
router.put("/:id", protect, authorize("admin", "manager"), updateProject);

// Any authenticated: list & view (controller restricts employee view scope)
router.get("/", protect, getAllProjects);
router.get("/:id", protect, getProject);

module.exports = router;