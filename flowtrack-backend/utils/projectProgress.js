const Project = require("../models/Project");
const Task = require("../models/Task");

async function updateProjectProgress(projectId) {
  if (!projectId) return { progress: 0, totalTasks: 0, completed: 0 };

  const totalTasks = await Task.countDocuments({ project: projectId });
  const completed = await Task.countDocuments({
    project: projectId,
    status: { $in: ["Completed", "completed", "Done", "done", "approved"] },
  });

  const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  await Project.findByIdAndUpdate(projectId, { progress }, { new: true });
  return { progress, totalTasks, completed };
}

module.exports = { updateProjectProgress };