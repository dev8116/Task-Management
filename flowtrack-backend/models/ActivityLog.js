const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:         { type: String, enum: ["admin", "manager", "employee"], default: null },
    action:       { type: String, required: true },
    description:  { type: String, default: "" },
    entity:       { type: String, default: "" }, // Attendance, Leave, Project, Task
    entityId:     { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedUser:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // e.g., target employee
    notificationFor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // if single-recipient
    isRead:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ notificationFor: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);