const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { notify, getRecipients } = require("../utils/notify");
const { compareFaces } = require("../utils/faceMatch");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

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

// @desc    Mark check-in
// @route   POST /api/attendance/check-in
exports.checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({ user: req.user._id, date: today });
    if (existing) return res.status(400).json({ message: "Already checked in for today" });

    const now = new Date();
    const hour = now.getHours();
    const status = hour >= 10 ? "Late" : "Present";

    const attendance = await Attendance.create({
      user: req.user._id,
      date: today,
      checkIn: now,
      status,
    });

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
// @route   POST /api/attendance/check-out
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
// @route   POST /api/attendance/face-check-in
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
// @route   POST /api/attendance/face-check-out
exports.faceCheckOut = async (req, res) => {
  try {
    const verification = await verifyFace(req);
    if (!verification.ok) return res.status(401).json({ message: verification.message });

    return exports.checkOut(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance records (scoped)
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate, status } = req.query;
    const query = {};

    if (req.user.role === "employee") {
      query.user = req.user._id;
    } else if (req.user.role === "manager") {
      // Only your team
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
      query.user = userId; // admin or higher roles could use this
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
// @route   GET /api/attendance/today
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