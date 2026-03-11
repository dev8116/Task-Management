const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

// @desc    Mark check-in
// @route   POST /api/attendance/check-in
exports.checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const existing = await Attendance.findOne({ user: req.user._id, date: today });
    if (existing) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    const now = new Date();
    const hour = now.getHours();
    let status = 'Present';
    if (hour >= 10) status = 'Late';

    const attendance = await Attendance.create({
      user: req.user._id,
      date: today,
      checkIn: now,
      status,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CHECK_IN',
      description: `Checked in at ${now.toLocaleTimeString()}`,
      entity: 'Attendance',
      entityId: attendance._id,
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
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate total hours
    const diffMs = now - attendance.checkIn;
    attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    if (attendance.totalHours < 4) {
      attendance.status = 'Half Day';
    }

    await attendance.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'CHECK_OUT',
      description: `Checked out at ${now.toLocaleTimeString()} - Total: ${attendance.totalHours}hrs`,
      entity: 'Attendance',
      entityId: attendance._id,
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    let query = {};
    const { userId, startDate, endDate } = req.query;

    if (req.user.role === 'employee') {
      query.user = req.user._id;
    } else if (userId) {
      query.user = userId;
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'name email department')
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
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    res.json(attendance || { checkedIn: false, checkedOut: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};