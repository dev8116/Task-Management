const mongoose = require("mongoose");

const keyResultSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: "" }, // e.g. "%", "tasks", "hrs"
  },
  { _id: true }
);

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user who owns goal
    team: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // manager/team owner

    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],

    keyResults: { type: [keyResultSchema], default: [] },

    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "On Hold"],
      default: "Not Started",
    },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);