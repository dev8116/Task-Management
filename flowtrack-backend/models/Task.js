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

    // ✅ Single assignedTo field (used by original Task-Management structure)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ Array field (used by FlowTrack multi-assign structure)
    assignedEmployees: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    status: {
      type: String,
      enum: ["pending", "in-progress", "pending-approval", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // ✅ Both deadline field names stored
    dueDate:  { type: Date, default: null },
    deadline: { type: Date, default: null },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Completion Submission ──────────────────────────────────
    submissionFile: {
      filename:   { type: String, default: null },
      path:       { type: String, default: null },
      mimetype:   { type: String, default: null },
      uploadedAt: { type: Date,   default: null },
    },
    submissionStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    submissionNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);