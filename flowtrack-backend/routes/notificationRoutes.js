const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:id/read", protect, markOneRead);
router.patch("/read-all", protect, markAllRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;