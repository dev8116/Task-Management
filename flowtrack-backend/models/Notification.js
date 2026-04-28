const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
    actor:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who did the action
    role:        { type: String, enum: ["admin", "manager", "employee"], default: null },
    action:      { type: String, required: true },
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    entity:      { type: String, default: "" },
    entityId:    { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);