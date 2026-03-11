const path = require("path");
const fs   = require("fs");
const Task = require("../models/Task");
const User = require("../models/User");

// ── GET /api/tasks ───────────────────────────────────────────
exports.getTasks = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "manager") {
      query = { $or: [{ assignedManager: req.user._id }, { createdBy: req.user._id }] };
    } else if (req.user.role === "employee") {
      query = { assignedEmployees: req.user._id };
    }

    if (req.query.status)    query.status   = req.query.status;
    if (req.query.priority)  query.priority = req.query.priority;
    if (req.query.projectId) query.project  = req.query.projectId;

    const tasks = await Task.find(query)
      .populate("project",           "title status")
      .populate("createdBy",         "name email role")
      .populate("assignedManager",   "name email")
      .populate("assignedEmployees", "name email avatar")
      .populate("updatedBy",         "name")
      .sort("-createdAt");

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tasks/:id ───────────────────────────────────────
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project",           "title status")
      .populate("createdBy",         "name email role")
      .populate("assignedManager",   "name email")
      .populate("assignedEmployees", "name email avatar")
      .populate("updatedBy",         "name");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/tasks ──────────────────────────────────────────
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignedManager, assignedEmployees, priority, dueDate, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    const taskData = {
      title, description,
      project:   project  || null,
      priority:  priority || "medium",
      dueDate:   dueDate  || null,
      // Manager can set initial status on creation; defaults to "pending"
      status:    status   || "pending",
      createdBy: req.user._id,
    };

    if (req.user.role === "admin") {
      if (!assignedManager) {
        return res.status(400).json({ success: false, message: "Admin must provide assignedManager" });
      }
      const mgr = await User.findById(assignedManager);
      if (!mgr || mgr.role !== "manager") {
        return res.status(400).json({ success: false, message: "assignedManager must be a valid manager" });
      }
      taskData.assignedManager = assignedManager;

    } else if (req.user.role === "manager") {
      taskData.assignedManager = req.user._id;

      if (assignedEmployees && assignedEmployees.length > 0) {
        const validEmps = await User.find({
          _id:     { $in: assignedEmployees },
          role:    "employee",
          manager: req.user._id,
        });
        if (validEmps.length !== assignedEmployees.length) {
          return res.status(400).json({ success: false, message: "Some employees are not in your team" });
        }
        taskData.assignedEmployees = assignedEmployees;
      }
    }

    const task = await Task.create(taskData);
    await task.populate([
      { path: "assignedManager",   select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "project",           select: "title" },
    ]);

    res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/tasks/:id  (Admin or Manager — NO status change allowed) ─────
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "manager" &&
        task.assignedManager?.toString() !== req.user._id.toString() &&
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only update tasks assigned to you" });
    }

    const { title, description, project, assignedManager, assignedEmployees, priority, dueDate } = req.body;

    // ── Manager CANNOT change status via this endpoint ──────────
    // (status field intentionally excluded)

    if (title)                     task.title       = title;
    if (description !== undefined) task.description = description;
    if (project     !== undefined) task.project     = project;
    if (priority)                  task.priority    = priority;
    if (dueDate)                   task.dueDate     = dueDate;

    if (req.user.role === "admin" && assignedManager) {
      task.assignedManager = assignedManager;
    }

    if (assignedEmployees !== undefined) {
      if (req.user.role === "manager") {
        const validEmps = await User.find({
          _id:     { $in: assignedEmployees },
          role:    "employee",
          manager: req.user._id,
        });
        if (validEmps.length !== assignedEmployees.length) {
          return res.status(400).json({ success: false, message: "Some employees are not in your team" });
        }
      }
      task.assignedEmployees = assignedEmployees;
    }

    task.updatedBy = req.user._id;
    await task.save();

    res.json({ success: true, message: "Task updated", data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/tasks/:id/status  (Employee only — pending ↔ in-progress) ──
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Only assigned employees can call this endpoint
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can update task status via this endpoint" });
    }

    if (!task.assignedEmployees.map(String).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You are not assigned to this task" });
    }

    // Allowed transitions:
    //   pending     → in-progress  ✅
    //   in-progress → pending      ✅ (revert)
    //   in-progress → completed    ❌ must use /submit-completion instead
    //   completed   → anything     ❌ task is locked
    const allowed = {
      "pending":     ["in-progress"],
      "in-progress": ["pending"],
    };

    if (task.status === "completed" || task.status === "pending-approval") {
      return res.status(400).json({
        success: false,
        message: task.status === "completed"
          ? "Task is already completed and cannot be changed"
          : "Task is awaiting manager approval. Cannot change status now.",
      });
    }

    if (!allowed[task.status] || !allowed[task.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from '${task.status}' to '${status}'. To mark complete, upload a file using Submit Completion.`,
      });
    }

    task.status    = status;
    task.updatedBy = req.user._id;
    await task.save();

    res.json({ success: true, message: `Task status updated to '${status}'`, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/tasks/:id/submit-completion  (Employee — upload file) ─────────
exports.submitCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can submit completion" });
    }

    if (!task.assignedEmployees.map(String).includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You are not assigned to this task" });
    }

    if (task.status !== "in-progress") {
      return res.status(400).json({ success: false, message: "Task must be 'in-progress' to submit completion" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a PDF, Word document, or screenshot" });
    }

    task.submissionFile = {
      filename:   req.file.originalname,
      path:       req.file.filename,       // stored filename on disk
      mimetype:   req.file.mimetype,
      uploadedAt: new Date(),
    };
    task.submissionStatus = "pending";
    task.status           = "pending-approval";
    task.updatedBy        = req.user._id;
    await task.save();

    res.json({ success: true, message: "Completion submitted. Waiting for manager approval.", data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/tasks/:id/review-submission  (Manager — approve or reject) ──
exports.reviewSubmission = async (req, res) => {
  try {
    const { decision, note } = req.body; // decision: "approved" | "rejected"

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approved' or 'rejected'" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "manager") {
      return res.status(403).json({ success: false, message: "Only managers can review task submissions" });
    }

    if (task.assignedManager?.toString() !== req.user._id.toString() &&
        task.createdBy.toString()        !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (task.status !== "pending-approval") {
      return res.status(400).json({ success: false, message: "Task is not pending approval" });
    }

    if (decision === "approved") {
      task.status           = "completed";
      task.submissionStatus = "approved";
      task.submissionNote   = "";
    } else {
      // Rejected → send back to in-progress so employee can re-submit
      task.status           = "in-progress";
      task.submissionStatus = "rejected";
      task.submissionNote   = note || "Submission rejected by manager";
    }

    task.updatedBy = req.user._id;
    await task.save();

    res.json({
      success: true,
      message: decision === "approved" ? "Task approved and marked as completed!" : "Submission rejected. Employee can re-submit.",
      data: task,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tasks/:id/submission-file  (Manager — download/view file) ──────
exports.getSubmissionFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "manager") {
      return res.status(403).json({ success: false, message: "Only managers can view submission files" });
    }

    if (!task.submissionFile?.path) {
      return res.status(404).json({ success: false, message: "No submission file found" });
    }

    const filePath = path.join(__dirname, "../uploads/task-submissions", task.submissionFile.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found on server" });
    }

    res.setHeader("Content-Disposition", `inline; filename="${task.submissionFile.filename}"`);
    res.setHeader("Content-Type", task.submissionFile.mimetype);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/tasks/:id  (Admin or Manager) ────────────────
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "manager" &&
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete tasks you created" });
    }

    await task.deleteOne();
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};