const path = require("path");
const fs = require("fs");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { notify, getRecipients } = require("../utils/notify");
const { updateProjectProgress } = require("../utils/projectProgress");

// ── GitHub validators ─────────────────────────────────────────
const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

function isValidGitHubBranchName(branch) {
  if (isEmpty(branch)) return true;
  const b = String(branch).trim();
  // allow letters/numbers/._-/ (common branch names like feature/login_fix)
  return /^[A-Za-z0-9._\-\/]+$/.test(b) && !b.includes("..") && !b.startsWith("/") && !b.endsWith("/");
}

function isValidGitHubIssueUrl(url) {
  if (isEmpty(url)) return true;
  const s = String(url).trim();
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/issues\/\d+\/?(#.*)?$/.test(s);
}

function isValidGitHubCommitUrl(url) {
  if (isEmpty(url)) return true;
  const s = String(url).trim();
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/commit\/[0-9a-fA-F]{7,40}\/?$/.test(s);
}

function isValidGitHubPullRequestUrl(url) {
  if (isEmpty(url)) return true;
  const s = String(url).trim();
  return /^https:\/\/github\.com\/[^\/\s]+\/[^\/\s]+\/pull\/\d+\/?$/.test(s);
}

function normalizeStr(v) {
  return String(v || "").trim();
}

// ── GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "employee") {
      query.$or = [{ assignedTo: req.user._id }, { assignedEmployees: req.user._id }];
      const me = await User.findById(req.user._id).select("manager");
      query.$and = [{ assignedManager: me?.manager || null }];
    } else if (req.user.role === "manager") {
      query.$and = [{ createdBy: req.user._id }, { assignedManager: req.user._id }];
    }

    const tasks = await Task.find(query)
      .populate("project", "name assignedManager githubRepoUrl")
      .populate("assignedTo", "name email")
      .populate("assignedEmployees", "name email")
      .populate("createdBy", "name email")
      .populate("assignedManager", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name assignedManager githubRepoUrl")
      .populate("assignedTo", "name email")
      .populate("assignedEmployees", "name email")
      .populate("createdBy", "name email")
      .populate("assignedManager", "name email");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (
      req.user.role === "manager" &&
      (task.assignedManager?.toString() !== req.user._id.toString() ||
        task.createdBy?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/tasks (Admin/Manager)
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      assignedManager,
      assignedTo,
      assignedEmployees = [],
      priority,
      dueDate,
      deadline,
      status,

      // ✅ GitHub fields (Admin/Manager only)
      githubBranch,
      githubIssueUrl,
    } = req.body;

    // Validate GitHub fields
    if (!isValidGitHubBranchName(githubBranch)) {
      return res.status(400).json({ success: false, message: "Invalid GitHub branch name." });
    }
    if (!isValidGitHubIssueUrl(githubIssueUrl)) {
      return res.status(400).json({ success: false, message: "Invalid GitHub issue URL." });
    }

    // Resolve manager: explicit > project owner > manager creating
    let resolvedManager = assignedManager;
    if (!resolvedManager && project) {
      const proj = await Project.findById(project).select("assignedManager");
      resolvedManager = proj?.assignedManager;
    }
    if (!resolvedManager && req.user.role === "manager") resolvedManager = req.user._id;

    // Ensure manager cannot create task on someone else's project; claim unassigned
    if (req.user.role === "manager" && project) {
      const proj = await Project.findById(project).select("assignedManager");
      if (!proj) return res.status(404).json({ success: false, message: "Project not found" });

      if (!proj.assignedManager) {
        proj.assignedManager = req.user._id;
        await proj.save();
        resolvedManager = req.user._id;
      } else if (proj.assignedManager.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "You cannot create tasks for another manager's project" });
      }
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedManager: resolvedManager,
      assignedTo,
      assignedEmployees: assignedEmployees.length ? assignedEmployees : assignedTo ? [assignedTo] : [],
      priority,
      dueDate: deadline || dueDate || null,
      deadline: deadline || dueDate || null,
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,

      // GitHub (manager/admin set)
      githubBranch: normalizeStr(githubBranch),
      githubIssueUrl: normalizeStr(githubIssueUrl),

      // commit/pr must be empty at create (employee submits later)
      githubCommitUrl: "",
      githubPullRequestUrl: "",
    });

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "project", select: "name githubRepoUrl" },
    ]);

    const actorDoc = await User.findById(req.user._id);
    const recipientIds = [];
    if (task.assignedTo) recipientIds.push(task.assignedTo._id);
    task.assignedEmployees.forEach((u) => recipientIds.push(u._id));
    if (resolvedManager) recipientIds.push(resolvedManager);

    const adminMgrs = await getRecipients(actorDoc, recipientIds);
    const uniqueRecipients = Array.from(new Set(adminMgrs.concat(recipientIds.map(String))));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "CREATE_TASK",
      title: "New task assigned",
      description: `${actorDoc.name} created task "${task.title}"`,
      entity: "Task",
      entityId: task._id,
      recipients: uniqueRecipients,
    });

    if (task.project) await updateProjectProgress(task.project);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/tasks/:id (Admin/Manager)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (task.status === "completed") {
      return res.status(400).json({ success: false, message: "Completed tasks cannot be edited" });
    }

    if (
      req.user.role === "manager" &&
      (task.assignedManager?.toString() !== req.user._id.toString() ||
        task.createdBy?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const {
      title,
      description,
      project,
      assignedManager,
      assignedTo,
      assignedEmployees,
      priority,
      dueDate,
      deadline,
      status,

      // ✅ GitHub fields (Admin/Manager only)
      githubBranch,
      githubIssueUrl,

      // ignore these if someone tries via updateTask (employee submits later)
      githubCommitUrl,
      githubPullRequestUrl,
    } = req.body;

    if (githubCommitUrl !== undefined || githubPullRequestUrl !== undefined) {
      // prevent manager/admin from setting commit/pr in create/edit route
      // (employee must submit via submitCompletion)
    }

    if (githubBranch !== undefined && !isValidGitHubBranchName(githubBranch)) {
      return res.status(400).json({ success: false, message: "Invalid GitHub branch name." });
    }
    if (githubIssueUrl !== undefined && !isValidGitHubIssueUrl(githubIssueUrl)) {
      return res.status(400).json({ success: false, message: "Invalid GitHub issue URL." });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;

    const newDeadline = deadline || dueDate;
    if (newDeadline) {
      task.dueDate = newDeadline;
      task.deadline = newDeadline;
    }

    if (project !== undefined) {
      if (req.user.role === "manager" && project) {
        const proj = await Project.findById(project).select("assignedManager");
        if (!proj) return res.status(404).json({ success: false, message: "Project not found" });
        if (proj.assignedManager?.toString() !== req.user._id.toString()) {
          return res
            .status(403)
            .json({ success: false, message: "You cannot move task to another manager's project" });
        }
        task.assignedManager = proj.assignedManager;
      }
      task.project = project;
    }

    if (assignedManager !== undefined) task.assignedManager = assignedManager;
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo;
      task.assignedEmployees = assignedEmployees && assignedEmployees.length ? assignedEmployees : [assignedTo];
    } else if (assignedEmployees !== undefined) {
      task.assignedEmployees = assignedEmployees;
      if (!task.assignedTo && assignedEmployees.length) task.assignedTo = assignedEmployees[0];
    }

    // ✅ GitHub fields update
    if (githubBranch !== undefined) task.githubBranch = normalizeStr(githubBranch);
    if (githubIssueUrl !== undefined) task.githubIssueUrl = normalizeStr(githubIssueUrl);

    task.updatedBy = req.user._id;
    await task.save();

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "project", select: "name githubRepoUrl" },
    ]);

    const actorDoc = await User.findById(req.user._id);
    const recipientIds = [];
    if (task.assignedTo) recipientIds.push(task.assignedTo._id);
    task.assignedEmployees.forEach((u) => recipientIds.push(u._id));
    if (task.assignedManager) recipientIds.push(task.assignedManager);

    const adminMgrs = await getRecipients(actorDoc, recipientIds);
    const uniqueRecipients = Array.from(new Set(adminMgrs.concat(recipientIds.map(String))));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "UPDATE_TASK",
      title: "Task updated",
      description: `${actorDoc.name} updated task "${task.title}"`,
      entity: "Task",
      entityId: task._id,
      recipients: uniqueRecipients,
    });

    if (task.project) await updateProjectProgress(task.project);

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/tasks/:id/status  (Employee only)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can update task status" });
    }

    const isAssigned =
      task.assignedTo?.toString() === req.user._id.toString() ||
      task.assignedEmployees.map(String).includes(req.user._id.toString());

    if (!isAssigned) {
      return res.status(403).json({ success: false, message: "You are not assigned to this task" });
    }

    const allowed = { pending: ["in-progress"], "in-progress": ["pending"] };
    if (task.status === "completed" || task.status === "pending-approval") {
      return res.status(400).json({ success: false, message: "Task already completed or pending approval" });
    }
    if (!allowed[task.status] || !allowed[task.status].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: `Cannot change status from '${task.status}' to '${status}'` });
    }

    task.status = status;
    task.updatedBy = req.user._id;
    await task.save();

    const actorDoc = await User.findById(req.user._id);
    const recipientIds = [];
    if (task.assignedManager) recipientIds.push(task.assignedManager);
    const adminMgrs = await getRecipients(actorDoc, recipientIds);
    const uniqueRecipients = Array.from(new Set(adminMgrs.concat(recipientIds.map(String))));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "UPDATE_TASK_STATUS",
      title: "Task status updated",
      description: `${actorDoc.name} set task "${task.title}" to ${status}`,
      entity: "Task",
      entityId: task._id,
      recipients: uniqueRecipients,
    });

    if (task.project) await updateProjectProgress(task.project);

    res.json({ success: true, message: `Status updated to '${status}'`, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/tasks/:id/submit-completion  (Employee)
exports.submitCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Only employees can submit task completion" });
    }

    const isAssigned =
      task.assignedTo?.toString() === req.user._id.toString() ||
      task.assignedEmployees.map(String).includes(req.user._id.toString());

    if (!isAssigned) {
      return res.status(403).json({ success: false, message: "You are not assigned to this task" });
    }

    const { githubCommitUrl, githubPullRequestUrl, submissionNote } = req.body;

    // ✅ REQUIRED (commit + PR)
    if (isEmpty(githubCommitUrl)) {
      return res.status(400).json({ success: false, message: "GitHub commit URL is required." });
    }
    if (isEmpty(githubPullRequestUrl)) {
      return res.status(400).json({ success: false, message: "GitHub pull request URL is required." });
    }

    // ✅ Validate formats
    if (!isValidGitHubCommitUrl(githubCommitUrl)) {
      return res.status(400).json({ success: false, message: "Invalid GitHub commit URL." });
    }
    if (!isValidGitHubPullRequestUrl(githubPullRequestUrl)) {
      return res.status(400).json({ success: false, message: "Invalid GitHub pull request URL." });
    }

    // ✅ OPTIONAL file upload
    if (req.file) {
      task.submissionFile = {
        filename: req.file.filename,
        path: req.file.filename,
        mimetype: req.file.mimetype,
        uploadedAt: new Date(),
      };
    }

    // ✅ Always move to pending approval when employee submits (even without file)
    task.submissionStatus = "pending-approval";
    task.status = "pending-approval";

    // ✅ store commit/pr links from employee (required)
    task.githubCommitUrl = normalizeStr(githubCommitUrl);
    task.githubPullRequestUrl = normalizeStr(githubPullRequestUrl);

    task.submissionNote = submissionNote || "";
    await task.save();

    const actorDoc = await User.findById(req.user._id);
    const recipientIds = [];
    if (task.assignedManager) recipientIds.push(task.assignedManager);
    const adminMgrs = await getRecipients(actorDoc, recipientIds);
    const uniqueRecipients = Array.from(new Set(adminMgrs.concat(recipientIds.map(String))));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "SUBMIT_TASK",
      title: "Task submitted",
      description: `${actorDoc.name} submitted task "${task.title}" for review`,
      entity: "Task",
      entityId: task._id,
      recipients: uniqueRecipients,
    });

    if (task.project) await updateProjectProgress(task.project);

    res.json({ success: true, message: "Submission uploaded", data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/tasks/:id/review-submission  (Manager/Admin)
exports.reviewSubmission = async (req, res) => {
  try {
    const { decision, note } = req.body; // approved|rejected
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (
      req.user.role === "manager" &&
      (task.assignedManager?.toString() !== req.user._id.toString() ||
        task.createdBy?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be approved or rejected" });
    }

    task.submissionStatus = decision === "approved" ? "approved" : "rejected";
    task.status = decision === "approved" ? "completed" : "in-progress";
    task.submissionNote = note || "";
    task.updatedBy = req.user._id;
    await task.save();

    const actorDoc = await User.findById(req.user._id);
    const recipientIds = [];
    if (task.assignedTo) recipientIds.push(task.assignedTo);
    task.assignedEmployees.forEach((u) => recipientIds.push(u));

    const adminMgrs = await getRecipients(actorDoc, recipientIds);
    const uniqueRecipients = Array.from(new Set(adminMgrs.concat(recipientIds.map(String))));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: decision === "approved" ? "APPROVE_TASK" : "REJECT_TASK",
      title: decision === "approved" ? "Task approved" : "Task rejected",
      description: `${actorDoc.name} ${decision} task "${task.title}"`,
      entity: "Task",
      entityId: task._id,
      recipients: uniqueRecipients,
    });

    if (task.project) await updateProjectProgress(task.project);

    res.json({ success: true, message: `Submission ${decision}`, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tasks/:id/submission-file  (Manager/Admin)
exports.getSubmissionFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (
      req.user.role === "manager" &&
      (task.assignedManager?.toString() !== req.user._id.toString() ||
        task.createdBy?.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (!["manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!task.submissionFile?.path) {
      return res.status(404).json({ success: false, message: "No submission file found" });
    }

    const stored = task.submissionFile.path;
    const filePath = stored.includes("uploads")
      ? path.resolve(stored)
      : path.join(__dirname, "../uploads/task-submissions", stored);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found on server" });
    }

    res.setHeader("Content-Disposition", `inline; filename="${task.submissionFile.filename}"`);
    res.setHeader("Content-Type", task.submissionFile.mimetype || "application/octet-stream");
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/tasks/:id  (Admin or Manager)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (task.status === "completed") {
      return res.status(400).json({ success: false, message: "Completed tasks cannot be deleted" });
    }

    if (
      req.user.role === "manager" &&
      (task.assignedManager?.toString() !== req.user._id.toString() ||
        task.createdBy.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: "You can only delete your own tasks" });
    }

    await Task.findByIdAndDelete(req.params.id);

    const actorDoc = await User.findById(req.user._id);
    const recipientIds = [];
    if (task.assignedTo) recipientIds.push(task.assignedTo);
    task.assignedEmployees.forEach((u) => recipientIds.push(u));
    if (task.assignedManager) recipientIds.push(task.assignedManager);

    const adminMgrs = await getRecipients(actorDoc, recipientIds);
    const uniqueRecipients = Array.from(new Set(adminMgrs.concat(recipientIds.map(String))));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "DELETE_TASK",
      title: "Task deleted",
      description: `${actorDoc.name} deleted task "${task.title}"`,
      entity: "Task",
      entityId: task._id,
      recipients: uniqueRecipients,
    });

    if (task.project) await updateProjectProgress(task.project);

    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};