require("dotenv").config();
const connectDB = require("../config/db");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const seedAdmin = require("../utils/seedAdmin");

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

  if (rec.frequency === "daily") return addDays(base, interval);

  if (rec.frequency === "weekly") {
    const days = Array.isArray(rec.daysOfWeek)
      ? rec.daysOfWeek
          .map((n) => parseInt(n, 10))
          .filter((n) => n >= 0 && n <= 6)
          .sort((a, b) => a - b)
      : [];

    if (!days.length) return addDays(base, 7 * interval);

    const baseDay = base.getDay();
    const nextDay = days.find((d) => d > baseDay);
    if (nextDay !== undefined) return addDays(base, nextDay - baseDay);

    const firstDay = days[0];
    const diff = 7 * interval - (baseDay - firstDay);
    return addDays(base, diff);
  }

  const day = Math.min(31, Math.max(1, parseInt(rec.dayOfMonth || "", 10) || base.getDate()));
  const d = new Date(base);
  d.setMonth(d.getMonth() + interval);
  d.setDate(day);
  return d;
};

const run = async () => {
  try {
    await connectDB();
    await seedAdmin();

    const admin = await User.findOne({ email: "admin@flowtrack.com" });
    if (!admin) throw new Error("Admin not found.");

    let manager = await User.findOne({ email: "manager@flowtrack.com" });
    if (!manager) {
      manager = await User.create({
        name: "Demo Manager",
        email: "manager@flowtrack.com",
        password: admin.password,
        role: "manager",
        department: "Engineering",
        phone: "1000000000",
      });
    }

    let employee = await User.findOne({ email: "employee@flowtrack.com" });
    if (!employee) {
      employee = await User.create({
        name: "Demo Employee",
        email: "employee@flowtrack.com",
        password: admin.password,
        role: "employee",
        department: "Engineering",
        phone: "2000000000",
        manager: manager._id,
      });
      await User.findByIdAndUpdate(manager._id, { $addToSet: { teamMembers: employee._id } });
    }

    let project = await Project.findOne({ name: "FlowTrack Core" });
    if (!project) {
      project = await Project.create({
        name: "FlowTrack Core",
        description: "Demo project for dependencies, subtasks, and recurrence.",
        status: "In Progress",
        priority: "High",
        startDate: new Date(),
        manager: manager._id,
        team: [employee._id],
        createdBy: admin._id,
        progress: 0,
      });
    } else {
      project.team = Array.from(new Set([...(project.team || []), employee._id]));
      await project.save();
    }

    const taskA = await Task.create({
      title: "Set up project structure",
      description: "Initialize repo, add linting, and scaffold modules.",
      project: project._id,
      createdBy: admin._id,
      assignedManager: manager._id,
      assignedTo: employee._id,
      assignedEmployees: [employee._id],
      priority: "high",
      status: "pending",
      dueDate: new Date(Date.now() + 5 * 86400000),
      deadline: new Date(Date.now() + 5 * 86400000),
      checklist: [
        { text: "Initialize repo", done: false },
        { text: "Add lint config", done: false },
      ],
      subtasks: [
        { title: "Create folder structure", status: "pending" },
        { title: "Add README", status: "pending" },
      ],
      recurrence: { enabled: false },
    });

    const taskB = await Task.create({
      title: "Build authentication module",
      description: "Implement login, registration, and JWT.",
      project: project._id,
      createdBy: admin._id,
      assignedManager: manager._id,
      assignedTo: employee._id,
      assignedEmployees: [employee._id],
      priority: "urgent",
      status: "pending",
      dueDate: new Date(Date.now() + 10 * 86400000),
      deadline: new Date(Date.now() + 10 * 86400000),
      dependsOn: [taskA._id],
      recurrence: { enabled: false },
    });

    taskA.blocking = [taskB._id];
    await taskA.save();

    const taskC = await Task.create({
      title: "Design UI components",
      description: "Create reusable UI components.",
      project: project._id,
      createdBy: admin._id,
      assignedManager: manager._id,
      assignedTo: employee._id,
      assignedEmployees: [employee._id],
      priority: "medium",
      status: "in-progress",
      dueDate: new Date(Date.now() + 7 * 86400000),
      deadline: new Date(Date.now() + 7 * 86400000),
      checklist: [
        { text: "Buttons", done: true, completedAt: new Date() },
        { text: "Forms", done: false },
        { text: "Tables", done: false },
      ],
      subtasks: [
        { title: "Header component", status: "completed", completedAt: new Date() },
        { title: "Sidebar component", status: "in-progress" },
      ],
      recurrence: { enabled: false },
    });

    const recurrence = {
      enabled: true,
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [1, 3, 5],
      dayOfMonth: null,
      startDate: new Date(),
      endDate: null,
      nextRunAt: null,
    };
    recurrence.nextRunAt = computeNextRun(recurrence);

    const taskD = await Task.create({
      title: "Weekly status report",
      description: "Prepare weekly status summary.",
      project: project._id,
      createdBy: admin._id,
      assignedManager: manager._id,
      assignedTo: employee._id,
      assignedEmployees: [employee._id],
      priority: "low",
      status: "pending",
      dueDate: new Date(Date.now() + 3 * 86400000),
      deadline: new Date(Date.now() + 3 * 86400000),
      recurrence,
    });

    console.log("✅ Seed examples created.");
    console.log("Tasks:", taskA._id, taskB._id, taskC._id, taskD._id);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

run();