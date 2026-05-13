require("dotenv").config();
const connectDB = require("../config/db");
const Task = require("../models/Task");

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
    const nextDay = days.find((d) => d > baseDay);
    if (nextDay !== undefined) {
      return addDays(base, nextDay - baseDay);
    }

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

const run = async () => {
  try {
    await connectDB();

    await Task.updateMany(
      { dependsOn: { $exists: false } },
      { $set: { dependsOn: [] } }
    );
    await Task.updateMany(
      { blocking: { $exists: false } },
      { $set: { blocking: [] } }
    );
    await Task.updateMany(
      { checklist: { $exists: false } },
      { $set: { checklist: [] } }
    );
    await Task.updateMany(
      { subtasks: { $exists: false } },
      { $set: { subtasks: [] } }
    );
    await Task.updateMany(
      { recurrence: { $exists: false } },
      { $set: { recurrence: { enabled: false } } }
    );

    const tasks = await Task.find({ "recurrence.enabled": true });
    for (const task of tasks) {
      if (!task.recurrence?.nextRunAt) {
        task.recurrence.nextRunAt = computeNextRun(task.recurrence);
        await task.save();
      }
    }

    console.log("✅ Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

run();