const cron = require("node-cron");
const Attendance = require("../models/Attendance");

const todayStr = () => new Date().toISOString().split("T")[0];

function startAttendanceScheduler() {
  // Every 5 minutes: after 6 PM auto check-out normal attendance
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    if (now.getHours() < 18) return;

    const today = todayStr();

    const open = await Attendance.find({
      date: today,
      checkIn: { $ne: null },
      checkOut: null,
    });

    for (const a of open) {
      a.checkOut = now;
      const diffMs = a.checkOut - a.checkIn;
      a.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      if (a.totalHours < 4) a.status = "Half Day";
      await a.save();
    }
  });

  // Every 5 minutes: auto check-out overtime after 4 hours
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    const today = todayStr();

    const openOT = await Attendance.find({
      date: today,
      overtimeCheckIn: { $ne: null },
      overtimeCheckOut: null,
    });

    for (const a of openOT) {
      const diffMs = now - a.overtimeCheckIn;
      const hours = diffMs / (1000 * 60 * 60);

      if (hours >= 4) {
        a.overtimeCheckOut = new Date(a.overtimeCheckIn.getTime() + 4 * 60 * 60 * 1000);
        a.overtimeHours = 4;
        await a.save();
      }
    }
  });

  console.log("Attendance scheduler started (auto checkout @6PM, overtime auto checkout after 4h).");
}

module.exports = { startAttendanceScheduler };