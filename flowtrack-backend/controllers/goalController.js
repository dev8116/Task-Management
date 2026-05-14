const Goal = require("../models/Goal");
const Task = require("../models/Task");

const computeGoalProgress = async (goal) => {
  // If tasks linked → progress from task completion
  if (goal.tasks?.length > 0) {
    const totalTasks = await Task.countDocuments({ _id: { $in: goal.tasks } });
    const completedTasks = await Task.countDocuments({
      _id: { $in: goal.tasks },
      status: "completed",
    });
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { progress, totalTasks, completedTasks };
  }

  // If keyResults → progress from KRs
  if (goal.keyResults?.length > 0) {
    const total = goal.keyResults.reduce((sum, kr) => sum + (kr.targetValue || 0), 0);
    const current = goal.keyResults.reduce((sum, kr) => sum + (kr.currentValue || 0), 0);
    const progress = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return { progress, totalTasks: 0, completedTasks: 0 };
  }

  return { progress: 0, totalTasks: 0, completedTasks: 0 };
};

// @desc Create Goal
exports.createGoal = async (req, res) => {
  try {
    const { title, description, owner, team, project, tasks, keyResults, status, startDate, endDate } = req.body;

    const goal = await Goal.create({
      title,
      description,
      owner,
      team,
      project,
      tasks: Array.isArray(tasks) ? tasks : [],
      keyResults: Array.isArray(keyResults) ? keyResults : [],
      status,
      startDate,
      endDate,
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get Goals
exports.getGoals = async (req, res) => {
  try {
    const { ownerId, projectId, status } = req.query;
    let query = {};

    if (req.user.role === "employee") {
      query.owner = req.user._id;
    } else if (req.user.role === "manager") {
      query.$or = [{ team: req.user._id }, { owner: req.user._id }];
    }

    if (ownerId) query.owner = ownerId;
    if (projectId) query.project = projectId;
    if (status) query.status = status;

    const goals = await Goal.find(query)
      .populate("owner", "name email")
      .populate("project", "name status")
      .populate("tasks", "title status");

    const result = [];
    for (const g of goals) {
      const progressMeta = await computeGoalProgress(g);
      result.push({ ...g.toObject(), progress: progressMeta.progress, ...progressMeta });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get Single Goal
exports.getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate("owner", "name email")
      .populate("project", "name status")
      .populate("tasks", "title status");

    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const progressMeta = await computeGoalProgress(goal);
    res.json({ ...goal.toObject(), progress: progressMeta.progress, ...progressMeta });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update Goal
exports.updateGoal = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.tasks && !Array.isArray(updates.tasks)) updates.tasks = [];
    if (updates.keyResults && !Array.isArray(updates.keyResults)) updates.keyResults = [];

    const goal = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete Goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};