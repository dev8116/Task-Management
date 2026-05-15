const Attendance = require("../models/Attendance");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { notify, getRecipients } = require("../utils/notify");
const { verifyEmployeeFace } = require("../utils/selfieVerification");

// ----- TIME RULE HELPERS -----
const toMinutes = (d) => d.getHours() * 60 + d.getMinutes();
const CHECKIN_START = 10 * 60; // 10:00 AM
const CHECKIN_END = 11 * 60; // 11:00 AM
const AUTO_CHECKOUT_TIME = 18 * 60; // 18:00 (6PM)

const isEmployeeOrManager = (role) => role === "employee" || role === "manager";

// ✅ Random selfie checks for employee + manager
const SELFIE_RANDOM_CHECK_COUNT = 5;
const SELFIE_RANDOM_WINDOW_MINUTES = 10; // ✅ 10 minutes after check-in
const SELFIE_RESPONSE_WINDOW_MINUTES = 2;

// ✅ Auto check-out on 2nd miss => allowed misses = 1
const MAX_ALLOWED_SELFIE_MISSES = 1;

async function safeActivityLog({
  userId,
  role,
  action,
  description,
  entity = "Attendance",
  entityId,
  relatedUser = null,
}) {
  try {
    await ActivityLog.create({
      user: userId,
      role,
      action,
      description,
      entity,
      entityId,
      relatedUser,
    });
  } catch (e) {
    console.error("ActivityLog error:", e.message);
  }
}

async function autoCheckoutAttendance({ attendance, reason, actorUser }) {
  if (!attendance || attendance.checkOut) return attendance;

  const now = new Date();
  attendance.checkOut = now;
  attendance.autoCheckoutReason = reason;

  if (attendance.checkIn) {
    const diffMs = now - attendance.checkIn;
    attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    if (attendance.totalHours < 4) attendance.status = "Half Day";
  }

  await attendance.save();

  try {
    const actorDoc = actorUser || (await User.findById(attendance.user));
    const recipients = await getRecipients(actorDoc, []);
    await notify({
      actor: attendance.user,
      actorRole: actorDoc?.role || "employee",
      action: "AUTO_CHECK_OUT",
      title: "Auto Check-out",
      description: `${actorDoc?.name || "User"} was auto checked-out. Reason: ${reason}`,
      entity: "Attendance",
      entityId: attendance._id,
      recipients,
    });
  } catch (e) {
    console.error("notify error:", e.message);
  }

  return attendance;
}

// Face verification helper (used for face-check-in/out endpoints)
const verifyFaceForCheckInOut = async (req) => {
  if (!req.file?.buffer) return { ok: false, message: "Selfie image is required" };

  const user = await User.findById(req.user._id);
  if (!user?.avatar) return { ok: false, message: "Please upload a profile photo first" };

  const result = await verifyEmployeeFace(user.avatar, req.file.buffer);
  if (!result.ok) return { ok: false, message: result.reason || "Face not matched" };

  return { ok: true };
};

function dayKeyISO(d) {
  return new Date(d).toISOString().split("T")[0];
}

function randomInt(minInclusive, maxInclusive) {
  return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
}

// ✅ Create 5 random checks within 10 minutes after check-in
function buildRandomSelfieChecks({ checkInTime }) {
  const startMs = new Date(checkInTime).getTime();
  const endMs = startMs + SELFIE_RANDOM_WINDOW_MINUTES * 60 * 1000;

  const totalSeconds = Math.max(1, Math.floor((endMs - startMs) / 1000));
  const target = Math.min(SELFIE_RANDOM_CHECK_COUNT, totalSeconds + 1);

  const picked = new Set();
  const checks = [];

  while (checks.length < target) {
    const offsetSec = randomInt(0, totalSeconds);
    if (picked.has(offsetSec)) continue;
    picked.add(offsetSec);

    const scheduledAt = new Date(startMs + offsetSec * 1000);
    const responseDeadline = new Date(scheduledAt.getTime() + SELFIE_RESPONSE_WINDOW_MINUTES * 60 * 1000);

    checks.push({
      scheduledAt,
      notifiedAt: null,
      responseDeadline,
      selfieImage: "",
      status: "pending",
      verifiedAt: null,
      reason: "",
    });
  }

  checks.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  return checks;
}

function countSelfieMisses(attendance) {
  const checks = attendance?.selfieChecks || [];
  return checks.filter((c) => ["missed", "failed", "skipped"].includes(c.status)).length;
}

// @desc Mark check-in
exports.checkIn = async (req, res) => {
  try {
    const today = dayKeyISO(new Date());

    const existing = await Attendance.findOne({ user: req.user._id, date: today });
    if (existing?.checkIn) {
      return res.status(400).json({ message: "Already checked in for today" });
    }

    const now = new Date();
    const mins = toMinutes(now);

    if (isEmployeeOrManager(req.user.role)) {
      if (mins < CHECKIN_START) {
        return res.status(400).json({
          message: "Check-in allowed only after 10:00 AM",
        });
      }
    }

    // ✅ Late after 11 AM
    const status = mins > CHECKIN_END ? "Late" : "Present";

    const attendance = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      {
        $setOnInsert: { user: req.user._id, date: today },
        $set: { checkIn: now, status },
      },
      { upsert: true, new: true }
    );

    // ✅ Selfie checks for employee + manager
    if (isEmployeeOrManager(req.user.role)) {
      attendance.selfieChecks = buildRandomSelfieChecks({ checkInTime: now });
      attendance.autoCheckoutReason = "";
      await attendance.save();
    }

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(actorDoc, []);
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "CHECK_IN",
      title: "Check-in",
      description: `${actorDoc.name || "User"} checked in at ${now.toLocaleTimeString()} (${status})`,
      entity: "Attendance",
      entityId: attendance._id,
      recipients,
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mark check-out
exports.checkOut = async (req, res) => {
  try {
    const today = dayKeyISO(new Date());
    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance) return res.status(400).json({ message: "You have not checked in today" });
    if (attendance.checkOut) return res.status(400).json({ message: "Already checked out for today" });

    const now = new Date();
    attendance.checkOut = now;

    const diffMs = now - attendance.checkIn;
    attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    if (attendance.totalHours < 4) attendance.status = "Half Day";

    await attendance.save();

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(actorDoc, []);
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "CHECK_OUT",
      title: "Check-out",
      description: `${actorDoc.name || "User"} checked out (${attendance.totalHours} hrs)`,
      entity: "Attendance",
      entityId: attendance._id,
      recipients,
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Face check-in
exports.faceCheckIn = async (req, res) => {
  try {
    const verification = await verifyFaceForCheckInOut(req);
    if (!verification.ok) return res.status(401).json({ message: verification.message });
    return exports.checkIn(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Face check-out
exports.faceCheckOut = async (req, res) => {
  try {
    const verification = await verifyFaceForCheckInOut(req);
    if (!verification.ok) return res.status(401).json({ message: verification.message });
    return exports.checkOut(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Overtime check-in (after 6 PM only)
exports.overtimeCheckIn = async (req, res) => {
  try {
    const today = dayKeyISO(new Date());
    const now = new Date();
    const mins = toMinutes(now);

    if (!isEmployeeOrManager(req.user.role)) {
      return res.status(403).json({ message: "Only employee/manager can do overtime check-in" });
    }

    if (mins < AUTO_CHECKOUT_TIME) {
      return res.status(400).json({ message: "Overtime check-in allowed only after 6:00 PM" });
    }

    const record = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      { $setOnInsert: { user: req.user._id, date: today } },
      { upsert: true, new: true }
    );

    if (record.overtimeCheckIn) {
      return res.status(400).json({ message: "Already overtime checked in" });
    }

    record.overtimeCheckIn = now;
    await record.save();

    return res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Overtime check-out
exports.overtimeCheckOut = async (req, res) => {
  try {
    const today = dayKeyISO(new Date());
    const now = new Date();

    const record = await Attendance.findOne({ user: req.user._id, date: today });
    if (!record?.overtimeCheckIn) {
      return res.status(400).json({ message: "You have not overtime checked in today" });
    }
    if (record.overtimeCheckOut) {
      return res.status(400).json({ message: "Already overtime checked out" });
    }

    record.overtimeCheckOut = now;
    const diffMs = now - record.overtimeCheckIn;
    record.overtimeHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    await record.save();

    return res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get attendance
exports.getAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate, status } = req.query;
    const query = {};

    if (req.user.role === "employee") {
      query.user = req.user._id;
    } else if (req.user.role === "manager") {
      const team = await User.find({ manager: req.user._id }).select("_id");
      const teamIds = team.map((u) => u._id.toString());

      query.user = { $in: teamIds };
      if (userId) {
        if (!teamIds.includes(userId)) {
          return res.status(403).json({ message: "Not your team member" });
        }
        query.user = userId;
      }
    } else if (userId) {
      query.user = userId;
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate("user", "name email department manager role")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get today attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = dayKeyISO(new Date());
    const record = await Attendance.findOne({ user: req.user._id, date: today })
      .populate("user", "name email department");
    res.json(record || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/selfie-check
exports.getSelfieCheckRequirement = async (req, res) => {
  try {
    if (!isEmployeeOrManager(req.user.role)) return res.json({ required: false });

    const today = dayKeyISO(new Date());
    const now = new Date();

    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance?.checkIn || attendance.checkOut) return res.json({ required: false });

    const dueCheck = attendance.selfieChecks?.find((c) => {
      if (c.status !== "pending") return false;
      return c.scheduledAt <= now && now <= c.responseDeadline;
    });

    if (!dueCheck) return res.json({ required: false });

    if (!dueCheck.notifiedAt) {
      dueCheck.notifiedAt = now;
      await attendance.save();
    }

    return res.json({
      required: true,
      check: {
        _id: dueCheck._id,
        scheduledAt: dueCheck.scheduledAt,
        responseDeadline: dueCheck.responseDeadline,
        status: dueCheck.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// helper: apply miss and maybe auto-checkout
async function applyMissAndMaybeCheckout({ attendance, check, now, reason, actorUser }) {
  if (!attendance || attendance.checkOut) return attendance;

  check.status = check.status === "skipped" ? "skipped" : "missed";
  check.reason = reason || check.reason || "Selfie missed";

  const misses = countSelfieMisses(attendance);

  if (misses > MAX_ALLOWED_SELFIE_MISSES) {
    await safeActivityLog({
      userId: actorUser?._id || attendance.user,
      role: actorUser?.role || "employee",
      action: "AUTO_CHECK_OUT_MISSED_SELFIE",
      description: `Auto check-out due to selfie misses (${misses}).`,
      entityId: attendance._id,
    });

    await autoCheckoutAttendance({
      attendance,
      reason: `Missed selfie verification ${misses} times`,
      actorUser,
    });
  } else {
    await attendance.save();
  }

  return attendance;
}

// POST /api/attendance/selfie-check/:checkId
exports.submitSelfieCheck = async (req, res) => {
  try {
    if (!isEmployeeOrManager(req.user.role)) {
      return res.status(403).json({ message: "Only employee/manager can submit selfie verification" });
    }

    const { checkId } = req.params;
    const today = dayKeyISO(new Date());
    const now = new Date();

    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance?.checkIn || attendance.checkOut) {
      return res.status(400).json({ message: "Not checked in or already checked out" });
    }

    const check = attendance.selfieChecks?.id(checkId);
    if (!check) return res.status(404).json({ message: "Selfie check not found" });
    if (check.status !== "pending") {
      return res.status(400).json({ message: `Selfie check already ${check.status}` });
    }

    if (now > check.responseDeadline) {
      await applyMissAndMaybeCheckout({
        attendance,
        check,
        now,
        reason: "Selfie not submitted before deadline",
        actorUser: req.user,
      });

      const misses = countSelfieMisses(attendance);
      const msg =
        misses > MAX_ALLOWED_SELFIE_MISSES
          ? "Deadline missed. You were automatically checked out (2nd miss)."
          : "Deadline missed. This counts as a miss.";

      return res.status(400).json({ message: msg, attendance });
    }

    if (!req.file?.buffer) return res.status(400).json({ message: "Selfie image is required" });

    const user = await User.findById(req.user._id);
    if (!user?.avatar) return res.status(400).json({ message: "Please upload a profile photo (avatar) first" });

    const verify = await verifyEmployeeFace(user.avatar, req.file.buffer);

    if (verify.ok) {
      check.status = "verified";
      check.verifiedAt = now;
      check.reason = "";
      await attendance.save();

      await safeActivityLog({
        userId: req.user._id,
        role: req.user.role,
        action: "SELFIE_VERIFICATION_SUCCESS",
        description: "Selfie verification successful.",
        entityId: attendance._id,
      });

      return res.json({ message: "Selfie verified", attendance });
    }

    check.status = "failed";
    check.reason = verify.reason || "Face match failed";
    await attendance.save();

    await safeActivityLog({
      userId: req.user._id,
      role: req.user.role,
      action: "SELFIE_VERIFICATION_FAILED",
      description: `Selfie verification failed: ${check.reason}`,
      entityId: attendance._id,
    });

    const misses = countSelfieMisses(attendance);
    if (misses > MAX_ALLOWED_SELFIE_MISSES) {
      await autoCheckoutAttendance({
        attendance,
        reason: `Selfie failed and reached miss limit (${misses})`,
        actorUser: req.user,
      });

      return res.status(401).json({
        message: "Face verification failed. You were automatically checked out (2nd miss).",
        attendance,
      });
    }

    return res.status(401).json({
      message: "Face verification failed. This counts as a miss.",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/attendance/selfie-check/:checkId/skip
exports.skipSelfieCheck = async (req, res) => {
  try {
    if (!isEmployeeOrManager(req.user.role)) {
      return res.status(403).json({ message: "Only employee/manager can skip selfie verification" });
    }

    const { checkId } = req.params;
    const today = dayKeyISO(new Date());
    const now = new Date();

    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance?.checkIn || attendance.checkOut) {
      return res.status(400).json({ message: "Not checked in or already checked out" });
    }

    const check = attendance.selfieChecks?.id(checkId);
    if (!check) return res.status(404).json({ message: "Selfie check not found" });
    if (check.status !== "pending") {
      return res.status(400).json({ message: `Selfie check already ${check.status}` });
    }

    check.status = "skipped";
    await applyMissAndMaybeCheckout({
      attendance,
      check,
      now,
      reason: "User skipped selfie verification",
      actorUser: req.user,
    });

    const misses = countSelfieMisses(attendance);
    const msg =
      misses > MAX_ALLOWED_SELFIE_MISSES
        ? "You skipped selfie verification and were auto checked out (2nd miss)."
        : "You skipped selfie verification. This counts as a miss.";

    return res.json({ message: msg, attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/attendance/selfie-check/missed
exports.checkMissedSelfieDeadlines = async (req, res) => {
  try {
    if (!isEmployeeOrManager(req.user.role)) return res.json({ missed: false });

    const today = dayKeyISO(new Date());
    const now = new Date();

    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance?.checkIn || attendance.checkOut) return res.json({ missed: false });

    const missed = attendance.selfieChecks?.find((c) => c.status === "pending" && now > c.responseDeadline);
    if (!missed) return res.json({ missed: false });

    missed.status = "missed";
    missed.reason = "Selfie not submitted before deadline";

    await attendance.save();

    const missCount = countSelfieMisses(attendance);

    if (missCount > MAX_ALLOWED_SELFIE_MISSES) {
      await autoCheckoutAttendance({
        attendance,
        reason: "Missed selfie verification 2 times",
        actorUser: req.user,
      });

      return res.json({
        missed: true,
        message: "You missed selfie verification 2 times. Auto check-out applied.",
        attendance,
      });
    }

    return res.json({
      missed: true,
      message: "You missed selfie verification. Warning: next miss will auto check-out.",
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};