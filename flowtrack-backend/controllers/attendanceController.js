const Attendance = require('../models/Attendance');
const logActivity = require('../utils/activityLogger');

const MS_PER_HOUR = 1000 * 60 * 60;

const getTodayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const now = new Date();

    let record = await Attendance.findOne({ employeeId: req.user._id, date: today });
    if (record && record.checkIn) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    // Determine status: late if after 9:30 AM
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

    if (!record) {
      record = new Attendance({
        employeeId: req.user._id,
        date: today,
        checkIn: now,
        status: isLate ? 'late' : 'present',
      });
    } else {
      record.checkIn = now;
      record.status = isLate ? 'late' : 'present';
    }

    await record.save();
    await logActivity(req.user._id, 'CHECK_IN', `Checked in at ${now.toISOString()}`, req.ip);

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const now = new Date();

    const record = await Attendance.findOne({ employeeId: req.user._id, date: today });
    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: 'No check-in found for today' });
    }
    if (record.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    record.checkOut = now;

    // Half-day if worked less than 4 hours
    const hoursWorked =
      (record.checkOut - record.checkIn) / MS_PER_HOUR;
    if (hoursWorked < 4) {
      record.status = 'half-day';
    }

    await record.save();
    await logActivity(req.user._id, 'CHECK_OUT', `Checked out at ${now.toISOString()}`, req.ip);

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/by-date?date=YYYY-MM-DD — Admin, Manager
const getAttendanceByDate = async (req, res, next) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) {
      return res.status(400).json({ success: false, message: 'date query param required' });
    }

    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const data = await Attendance.find({ date: { $gte: start, $lte: end } }).populate(
      'employeeId',
      'name email department'
    );

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/today/all — Admin, Manager
const getTodayAll = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const data = await Attendance.find({ date: { $gte: today, $lte: end } }).populate(
      'employeeId',
      'name email department'
    );

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/:employeeId — Admin, Manager, or self
const getAttendanceByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === employeeId;

    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filter = { employeeId };

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        const s = new Date(req.query.startDate);
        s.setHours(0, 0, 0, 0);
        filter.date.$gte = s;
      }
      if (req.query.endDate) {
        const e = new Date(req.query.endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 31));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/:employeeId/monthly?month=M&year=YYYY
const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === employeeId;

    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const data = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceByDate,
  getTodayAll,
  getAttendanceByEmployee,
  getMonthlyAttendance,
};
