const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { notify, getRecipients } = require("../utils/notify");
const { compareFaces } = require("../utils/faceMatch");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ----- TIME RULE HELPERS -----
const toMinutes = (d) => d.getHours() * 60 + d.getMinutes();
const CHECKIN_START = 10 * 60;        // 10:00
const CHECKIN_END = 11 * 60;          // 11:00
const AUTO_CHECKOUT_TIME = 18 * 60;   // 18:00 (6PM)

const isEmployeeOrManager = (role) => role === "employee" || role === "manager";

const readRemote = (url) =>
  new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        const data = [];
        res.on("data", (c) => data.push(c));
        res.on("end", () => resolve(Buffer.concat(data)));
      })
      .on("error", reject);
  });

const getAvatarBuffer = async (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return readRemote(avatar);

  const safePath = avatar.replace(/^\//, "");
  const filePath = path.join(__dirname, "..", safePath);
  if (!fs.existsSync(filePath)) return null;
  return fs.promises.readFile(filePath);
};

const verifyFace = async (req) => {
  if (!req.file?.buffer) return { ok: false, message: "Selfie image is required" };

  const user = await User.findById(req.user._id);
  if (!user?.avatar) return { ok: false, message: "Please upload a profile photo first" };

  const refBuffer = await getAvatarBuffer(user.avatar);
  if (!refBuffer) return { ok: false, message: "Profile photo not found on server" };

  const result = await compareFaces(req.file.buffer, refBuffer);
  if (!result.matched) {
    return { ok: false, message: result.reason || "Face not matched" };
  }

  return { ok: true };
};

// @desc    Mark check-in (10–11 AM only for employee/manager)
exports.checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({ user: req.user._id, date: today });
    if (existing?.checkIn) {
      return res.status(400).json({ message: "Already checked in for today" });
    }

    const now = new Date();
    const mins = toMinutes(now);

    if (isEmployeeOrManager(req.user.role)) {
      if (mins < CHECKIN_START || mins > CHECKIN_END) {
        return res.status(400).json({
          message: "Check-in allowed only between 10:00 AM and 11:00 AM",
        });
      }
    }

    // if later you allow late check-in, this will work:
    const status = mins > CHECKIN_END ? "Late" : "Present";

    const attendance = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: today },
      { $setOnInsert: { user: req.user._id, date: today }, $set: { checkIn: now, status } },
      { upsert: true, new: true }
    );

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(actorDoc, []);
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "CHECK_IN",
      title: "Check-in",
      description: `${actorDoc.name || "User"} checked in at ${now.toLocaleTimeString()}`,
      entity: "Attendance",
      entityId: attendance._id,
      recipients,
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark check-out
exports.checkOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
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

// @desc    Face check-in
exports.faceCheckIn = async (req, res) => {
  try {
    const verification = await verifyFace(req);
    if (!verification.ok) return res.status(401).json({ message: verification.message });
    return exports.checkIn(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Face check-out
exports.faceCheckOut = async (req, res) => {
  try {
    const verification = await verifyFace(req);
    if (!verification.ok) return res.status(401).json({ message: verification.message });
    return exports.checkOut(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Overtime check-in (after 6 PM only)
exports.overtimeCheckIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
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

// @desc    Overtime check-out (manual)
exports.overtimeCheckOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
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

// @desc    Get attendance records (scoped)
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

// @desc    Get today's attendance status
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ user: req.user._id, date: today })
      .populate("user", "name email department");
    res.json(record || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};