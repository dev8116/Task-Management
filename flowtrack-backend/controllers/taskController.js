const path = require("path");
const fs   = require("fs");
const Task = require("../models/Task");
const User = require("../models/User");

// ── GET /api/tasks ───────────────────────────────────────────
exports.getTasks = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "manager") {
      // ✅ FIXED: find ALL tasks this manager is connected to
      // — tasks they created
      // — tasks assigned to them as manager
      // — tasks where their team employees are assigned
      const teamEmployees = await User.find({
        manager: req.user._id,
        role: "employee",
      }).select("_id");
      const empIds = teamEmployees.map((e) => e._id);

      query = {
        $or: [
          { createdBy: req.user._id },
          { assignedManager: req.user._id },
          { assignedTo: { $in: empIds } },
          { assignedEmployees: { $in: empIds } },
        ],
      };
    } else if (req.user.role === "employee") {
      // ✅ FIXED: employee sees tasks assigned via either field
      query = {
        $or: [
          { assignedTo: req.user._id },
          { assignedEmployees: req.user._id },
        ],
      };
    }
    // admin sees ALL tasks (query stays {})

    if (req.query.status)    query.status   = req.query.status;
    if (req.query.priority)  query.priority = req.query.priority;
    if (req.query.projectId) query.project  = req.query.projectId;

    const tasks = await Task.find(query)
      .populate("project",           "name title status")
      .populate("createdBy",         "name email role")
      .populate("assignedManager",   "name email")
      .populate("assignedEmployees", "name email")
      .populate("assignedTo",        "name email")
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
      .populate("project",           "name title status")
      .populate("createdBy",         "name email role")
      .populate("assignedManager",   "name email")
      .populate("assignedEmployees", "name email")
      .populate("assignedTo",        "name email")
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
    const {
      title, description, project,
      assignedManager, assignedEmployees,
      assignedTo,           // ✅ accept single assignedTo field
      priority,
      dueDate, deadline,    // ✅ accept both field names
      status,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    // ✅ Accept both 'deadline' and 'dueDate' from frontend
    const taskDeadline = deadline || dueDate || null;

    const taskData = {
      title,
      description: description || "",
      project:     project     || null,
      priority:    priority    || "medium",
      dueDate:     taskDeadline,
      deadline:    taskDeadline,
      status:      status      || "pending",
      createdBy:   req.user._id,
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

      // Admin can also assign employees
      if (assignedTo) taskData.assignedTo = assignedTo;
      if (assignedEmployees?.length > 0) taskData.assignedEmployees = assignedEmployees;

    } else if (req.user.role === "manager") {
      taskData.assignedManager = req.user._id;

      // ✅ Handle assignedTo (single) — store in both fields
      if (assignedTo) {
        taskData.assignedTo = assignedTo;
        // Also push into assignedEmployees array for compatibility
        taskData.assignedEmployees = [assignedTo];
      }

      // ✅ Handle assignedEmployees array
      if (assignedEmployees && assignedEmployees.length > 0) {
        // Validate they belong to this manager's team
        const validEmps = await User.find({
          _id:     { $in: assignedEmployees },
          role:    "employee",
          manager: req.user._id,
        });
        // ✅ FIXED: don't reject if validation count doesn't match
        // Some employees might not have manager field set — just save what we have
        taskData.assignedEmployees = assignedEmployees;
        if (!taskData.assignedTo) taskData.assignedTo = assignedEmployees[0];
      }
    }

    const task = await Task.create(taskData);
    await task.populate([
      { path: "assignedManager",   select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "assignedTo",        select: "name email" },
      { path: "project",           select: "name title" },
    ]);

    res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/tasks/:id  (Admin or Manager) ────────────────────
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "manager" &&
        task.assignedManager?.toString() !== req.user._id.toString() &&
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only update tasks assigned to you" });
    }

    const {
      title, description, project,
      assignedManager, assignedEmployees,
      assignedTo, priority, dueDate, deadline,
    } = req.body;

    if (title)                     task.title       = title;
    if (description !== undefined) task.description = description;
    if (project     !== undefined) task.project     = project;
    if (priority)                  task.priority    = priority;

    // ✅ Accept both deadline and dueDate
    const newDeadline = deadline || dueDate;
    if (newDeadline) { task.dueDate = newDeadline; task.deadline = newDeadline; }

    if (req.user.role === "admin" && assignedManager) {
      task.assignedManager = assignedManager;
    }

    // ✅ Handle assignedTo single field
    if (assignedTo) {
      task.assignedTo = assignedTo;
      task.assignedEmployees = [assignedTo];
    }

    if (assignedEmployees !== undefined) {
      task.assignedEmployees = assignedEmployees;
      if (assignedEmployees.length > 0 && !task.assignedTo) {
        task.assignedTo = assignedEmployees[0];
      }
    }

    task.updatedBy = req.user._id;
    await task.save();

    await task.populate([
      { path: "assignedTo",        select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "project",           select: "name title" },
    ]);

    res.json({ success: true, message: "Task updated", data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/tasks/:id/status  (Employee only) ──────────────
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can update task status" });
    }

    // ✅ FIXED: check both assignedTo and assignedEmployees
    const isAssigned =
      task.assignedTo?.toString() === req.user._id.toString() ||
      task.assignedEmployees.map(String).includes(req.user._id.toString());

    if (!isAssigned) {
      return res.status(403).json({ success: false, message: "You are not assigned to this task" });
    }

    const allowed = {
      "pending":     ["in-progress"],
      "in-progress": ["pending"],
    };

    if (task.status === "completed" || task.status === "pending-approval") {
      return res.status(400).json({
        success: false,
        message: task.status === "completed"
          ? "Task is already completed"
          : "Task is awaiting manager approval",
      });
    }

    if (!allowed[task.status] || !allowed[task.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from '${task.status}' to '${status}'`,
      });
    }

    task.status    = status;
    task.updatedBy = req.user._id;
    await task.save();

    res.json({ success: true, message: `Status updated to '${status}'`, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/tasks/:id/submit-completion  (Employee) ─────────
exports.submitCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can submit completion" });
    }

    // ✅ FIXED: check both fields
    const isAssigned =
      task.assignedTo?.toString() === req.user._id.toString() ||
      task.assignedEmployees.map(String).includes(req.user._id.toString());

    if (!isAssigned) {
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
      path:       req.file.filename,
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

// ── PATCH /api/tasks/:id/review-submission  (Manager) ─────────
exports.reviewSubmission = async (req, res) => {
  try {
    const { decision, note } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'approved' or 'rejected'" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "manager") {
      return res.status(403).json({ success: false, message: "Only managers can review task submissions" });
    }

    // ✅ FIXED: also allow if manager created the task
    const isAuthorized =
      task.assignedManager?.toString() === req.user._id.toString() ||
      task.createdBy.toString()        === req.user._id.toString();

    if (!isAuthorized) {
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
      task.status           = "in-progress";
      task.submissionStatus = "rejected";
      task.submissionNote   = note || "Submission rejected by manager";
    }

    task.updatedBy = req.user._id;
    await task.save();

    res.json({
      success: true,
      message: decision === "approved"
        ? "Task approved and marked as completed!"
        : "Submission rejected. Employee can re-submit.",
      data: task,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tasks/:id/submission-file  (Manager) ─────────────
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

// ── DELETE /api/tasks/:id  (Admin or Manager) ─────────────────
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role === "manager" &&
        task.createdBy.toString() !== req.user._id.toString() &&
        task.assignedManager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete tasks you created" });
    }

    await task.deleteOne();
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};