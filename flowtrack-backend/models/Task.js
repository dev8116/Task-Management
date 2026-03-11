const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, "Task title is required"], trim: true },
    description: { type: String, default: "" },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedEmployees: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    status: {
      type: String,
      // NEW: added "pending-approval" state
      enum: ["pending", "in-progress", "pending-approval", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate:   { type: Date, default: null },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── NEW: Completion Submission ──────────────────────────────
    submissionFile: {
      filename:    { type: String, default: null }, // original file name
      path:        { type: String, default: null }, // stored path on server
      mimetype:    { type: String, default: null },
      uploadedAt:  { type: Date,   default: null },
    },
    // "none" | "pending" | "approved" | "rejected"
    submissionStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    submissionNote: { type: String, default: "" }, // manager's rejection note
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);