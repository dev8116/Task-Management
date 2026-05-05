const cron = require("node-cron");
const Attendance = require("../models/Attendance");

const todayStr = () => new Date().toISOString().split("T")[0];

// rule config
const SELFIE_MISS_TIMEOUT_MINUTES = 2; // (already used when creating deadlines)
const MAX_ALLOWED_MISSES = 1; // auto-checkout on 2nd miss => allowed misses = 1

function countSelfieMisses(attendance) {
  const checks = attendance?.selfieChecks || [];
  return checks.filter((c) => ["missed", "failed", "skipped"].includes(c.status)).length;
}

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
      a.autoCheckoutReason = a.autoCheckoutReason || "Auto checkout after 6PM";
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

  // ✅ Every 1 minute: if selfie check deadline missed -> mark missed
  // ✅ Auto checkout only if misses reach 2 (allowed 1 miss)
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    const today = todayStr();

    const open = await Attendance.find({
      date: today,
      checkIn: { $ne: null },
      checkOut: null,
      "selfieChecks.status": "pending",
    });

    for (const a of open) {
      const checks = a.selfieChecks || [];

      // mark ALL expired pending checks as missed
      let changed = false;
      for (const c of checks) {
        if (c.status === "pending" && now > c.responseDeadline) {
          c.status = "missed";
          c.reason = `Selfie not submitted before deadline (${SELFIE_MISS_TIMEOUT_MINUTES} min)`;
          changed = true;
        }
      }

      if (changed) {
        const missCount = countSelfieMisses(a);

        // Auto-checkout on 2nd miss (missCount >= 2)
        if (missCount > MAX_ALLOWED_MISSES) {
          a.checkOut = now;
          a.autoCheckoutReason = "Missed selfie verification 2 times (scheduler)";

          const diffMs = a.checkOut - a.checkIn;
          a.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
          if (a.totalHours < 4) a.status = "Half Day";
        }

        await a.save();
      }
    }
  });

  console.log(
    "Attendance scheduler started (auto checkout @6PM, overtime auto checkout after 4h, selfie missed checks with 2-miss auto-checkout)."
  );
}

module.exports = { startAttendanceScheduler };