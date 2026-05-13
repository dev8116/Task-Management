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

// ── Dependency & Recurrence Helpers ───────────────────────────
const normalizeIdArray = (values = []) => {
  if (!Array.isArray(values)) return [];
  const list = values.map((v) => String(v)).filter(Boolean);
  return Array.from(new Set(list));
};

const normalizeChecklist = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const text = String(item?.text || "").trim();
      if (!text) return null;
      const done = !!item?.done;
      return {
        _id: item?._id,
        text,
        done,
        completedAt: done ? item?.completedAt || new Date() : null,
      };
    })
    .filter(Boolean);
};

const normalizeSubtasks = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const title = String(item?.title || "").trim();
      if (!title) return null;
      const status = ["pending", "in-progress", "completed"].includes(item?.status)
        ? item.status
        : "pending";
      return {
        _id: item?._id,
        title,
        description: String(item?.description || ""),
        assignedTo: item?.assignedTo || null,
        status,
        dueDate: item?.dueDate || null,
        completedAt:
          status === "completed" ? item?.completedAt || new Date() : null,
      };
    })
    .filter(Boolean);
};

const toDateOrNull = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const computeNextRun = (rec) => {
  if (!rec?.enabled) return null;
  const interval = Math.max(1, Number(rec.interval || 1));
  const startDate = toDateOrNull(rec.startDate) || new Date();
  const now = new Date();
  const base = startDate > now ? startDate : now;

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  if (rec.frequency === "daily") {
    return addDays(base, interval);
  }

  if (rec.frequency === "weekly") {
    const days = Array.isArray(rec.daysOfWeek)
      ? rec.daysOfWeek
          .map((n) => parseInt(n, 10))
          .filter((n) => n >= 0 && n <= 6)
          .sort((a, b) => a - b)
      : [];

    if (!days.length) {
      return addDays(base, 7 * interval);
    }

    const baseDay = base.getDay();
    const todayIndex = days.findIndex((d) => d === baseDay);
    const nextSameDay = todayIndex !== -1 ? base : null;

    if (nextSameDay) {
      return addDays(base, 7 * interval);
    }

    const nextDay = days.find((d) => d > baseDay);
    if (nextDay !== undefined) {
      const diff = nextDay - baseDay;
      return addDays(base, diff);
    }

    // wrap to next interval week
    const firstDay = days[0];
    const diff = 7 * interval - (baseDay - firstDay);
    return addDays(base, diff);
  }

  // monthly
  const day = Math.min(31, Math.max(1, parseInt(rec.dayOfMonth || "", 10) || base.getDate()));
  const d = new Date(base);
  d.setMonth(d.getMonth() + interval);
  d.setDate(day);
  return d;
};

const normalizeRecurrence = (raw) => {
  if (!raw || raw.enabled !== true) return { enabled: false };
  const frequency = ["daily", "weekly", "monthly"].includes(raw.frequency)
    ? raw.frequency
    : "daily";
  const interval = Math.max(1, parseInt(raw.interval, 10) || 1);
  const daysOfWeek = Array.isArray(raw.daysOfWeek)
    ? raw.daysOfWeek
        .map((n) => parseInt(n, 10))
        .filter((n) => n >= 0 && n <= 6)
    : [];
  const dayOfMonth = raw.dayOfMonth
    ? Math.min(31, Math.max(1, parseInt(raw.dayOfMonth, 10)))
    : null;

  const normalized = {
    enabled: true,
    frequency,
    interval,
    daysOfWeek,
    dayOfMonth,
    startDate: toDateOrNull(raw.startDate),
    endDate: toDateOrNull(raw.endDate),
    nextRunAt: null,
  };
  normalized.nextRunAt = computeNextRun(normalized);
  return normalized;
};

const getOpenDependencies = async (task) => {
  if (!task?.dependsOn?.length) return [];
  return Task.find({
    _id: { $in: task.dependsOn },
    status: { $ne: "completed" },
  }).select("title status");
};

const canManageTask = (task, user) => {
  if (!task || !user) return false;
  if (user.role === "admin") return true;
  if (user.role === "manager") {
    return (
      task.assignedManager?.toString() === user._id.toString() ||
      task.createdBy?.toString() === user._id.toString()
    );
  }
  if (user.role === "employee") {
    return (
      task.assignedTo?.toString() === user._id.toString() ||
      task.assignedEmployees?.map(String).includes(user._id.toString())
    );
  }
  return false;
};

const syncDependencies = async (task, newDependsOn) => {
  const oldDependsOn = (task.dependsOn || []).map(String);
  const nextDependsOn = newDependsOn.map(String);

  const removed = oldDependsOn.filter((id) => !nextDependsOn.includes(id));
  const added = nextDependsOn.filter((id) => !oldDependsOn.includes(id));

  if (removed.length) {
    await Task.updateMany(
      { _id: { $in: removed } },
      { $pull: { blocking: task._id } }
    );
  }

  if (added.length) {
    await Task.updateMany(
      { _id: { $in: added } },
      { $addToSet: { blocking: task._id } }
    );
  }

  task.dependsOn = nextDependsOn;
};

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
      .populate("dependsOn", "title status")
      .populate("blocking", "title status")
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
      .populate("assignedManager", "name email")
      .populate("dependsOn", "title status")
      .populate("blocking", "title status");

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

      // ✅ New fields
      dependsOn,
      checklist,
      subtasks,
      recurrence,
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

    const normalizedDependsOn = normalizeIdArray(dependsOn).filter((id) => id !== String(req.user._id));
    if (normalizedDependsOn.length) {
      const found = await Task.find({ _id: { $in: normalizedDependsOn } }).select("_id");
      if (found.length !== normalizedDependsOn.length) {
        return res.status(400).json({ success: false, message: "One or more dependency tasks not found." });
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

      // new
      dependsOn: normalizedDependsOn,
      checklist: normalizeChecklist(checklist),
      subtasks: normalizeSubtasks(subtasks),
      recurrence: normalizeRecurrence(recurrence),
    });

    if (normalizedDependsOn.length) {
      await Task.updateMany(
        { _id: { $in: normalizedDependsOn } },
        { $addToSet: { blocking: task._id } }
      );
    }

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "project", select: "name githubRepoUrl" },
      { path: "dependsOn", select: "title status" },
      { path: "blocking", select: "title status" },
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

      // ✅ New fields
      dependsOn,
      checklist,
      subtasks,
      recurrence,
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

    // ✅ Dependencies update
    if (dependsOn !== undefined) {
      const normalized = normalizeIdArray(dependsOn).filter((id) => id !== String(task._id));
      if (normalized.length) {
        const found = await Task.find({ _id: { $in: normalized } }).select("_id");
        if (found.length !== normalized.length) {
          return res.status(400).json({ success: false, message: "One or more dependency tasks not found." });
        }
      }
      await syncDependencies(task, normalized);
    }

    // ✅ Checklist / Subtasks
    if (checklist !== undefined) task.checklist = normalizeChecklist(checklist);
    if (subtasks !== undefined) task.subtasks = normalizeSubtasks(subtasks);

    // ✅ Recurrence
    if (recurrence !== undefined) {
      task.recurrence = normalizeRecurrence(recurrence);
    }

    // If trying to move forward while blocked
    if (["in-progress", "pending-approval", "completed"].includes(task.status)) {
      const openDeps = await getOpenDependencies(task);
      if (openDeps.length) {
        return res.status(400).json({
          success: false,
          message: `Task is blocked by ${openDeps.length} incomplete dependency task(s).`,
        });
      }
    }

    task.updatedBy = req.user._id;
    await task.save();

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "assignedEmployees", select: "name email" },
      { path: "project", select: "name githubRepoUrl" },
      { path: "dependsOn", select: "title status" },
      { path: "blocking", select: "title status" },
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

    if (status === "in-progress") {
      const openDeps = await getOpenDependencies(task);
      if (openDeps.length) {
        return res.status(400).json({
          success: false,
          message: `Task is blocked by ${openDeps.length} incomplete dependency task(s).`,
        });
      }
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

// ── PATCH /api/tasks/:id/checklist
exports.updateChecklist = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("dependsOn", "title status")
      .populate("blocking", "title status");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (!canManageTask(task, req.user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { checklist } = req.body;
    task.checklist = normalizeChecklist(checklist);
    task.updatedBy = req.user._id;
    await task.save();

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/tasks/:id/subtasks
exports.updateSubtasks = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("dependsOn", "title status")
      .populate("blocking", "title status");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (!canManageTask(task, req.user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { subtasks } = req.body;
    task.subtasks = normalizeSubtasks(subtasks);
    task.updatedBy = req.user._id;
    await task.save();

    res.json({ success: true, data: task });
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

    const openDeps = await getOpenDependencies(task);
    if (openDeps.length) {
      return res.status(400).json({
        success: false,
        message: `Task is blocked by ${openDeps.length} incomplete dependency task(s).`,
      });
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

    if (task.dependsOn?.length) {
      await Task.updateMany(
        { _id: { $in: task.dependsOn } },
        { $pull: { blocking: task._id } }
      );
    }

    if (task.blocking?.length) {
      await Task.updateMany(
        { _id: { $in: task.blocking } },
        { $pull: { dependsOn: task._id } }
      );
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