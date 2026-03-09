const { validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const logActivity = require('../utils/activityLogger');

const ANNUAL_LEAVE_ALLOWANCE = 21; // days per year
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// POST /api/leaves — Employee applies for leave
const applyLeave = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.create({
      employeeId: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await logActivity(req.user._id, 'APPLY_LEAVE', `Applied for ${leaveType} leave`, req.ip);

    return res.status(201).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves — Admin, Manager; filterable by status, employeeId
const getAllLeaves = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const [data, total] = await Promise.all([
      Leave.find(filter)
        .populate('employeeId', 'name email department')
        .populate('reviewedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Leave.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/my-leaves — own leave requests
const getMyLeaves = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { employeeId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Leave.find(filter)
        .populate('reviewedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Leave.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/:userId — get leaves for a specific user
const getLeavesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === userId;

    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { employeeId: userId };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Leave.find(filter)
        .populate('reviewedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Leave.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/:userId/balance — leave balance for a user
const getLeaveBalance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const isSelf = req.user._id.toString() === userId;

    if (!isAdminOrManager && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const approvedLeaves = await Leave.find({
      employeeId: userId,
      status: 'approved',
      startDate: { $gte: yearStart, $lte: yearEnd },
    });

    const usedDays = approvedLeaves.reduce((total, leave) => {
      const diff = Math.ceil(
        (new Date(leave.endDate) - new Date(leave.startDate)) / MS_PER_DAY
      ) + 1;
      return total + diff;
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        total: ANNUAL_LEAVE_ALLOWANCE,
        used: usedDays,
        remaining: Math.max(0, ANNUAL_LEAVE_ALLOWANCE - usedDays),
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leaves/:id/approve — Admin, Manager
const approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is not pending' });
    }

    leave.status = 'approved';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    await logActivity(req.user._id, 'APPROVE_LEAVE', `Approved leave request ${leave._id}`, req.ip);

    return res.status(200).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leaves/:id/reject — Admin, Manager
const rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is not pending' });
    }

    leave.status = 'rejected';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    await logActivity(req.user._id, 'REJECT_LEAVE', `Rejected leave request ${leave._id}`, req.ip);

    return res.status(200).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
};

// PUT /api/leaves/:id — Approve or Reject (Admin, Manager)
const updateLeave = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Status must be "approved" or "rejected"' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is not pending' });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    await logActivity(
      req.user._id,
      `${status.toUpperCase()}_LEAVE`,
      `${status} leave request ${leave._id}`,
      req.ip
    );

    return res.status(200).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/leaves/:id — Employee cancels own pending leave
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
    }

    await leave.deleteOne();
    await logActivity(req.user._id, 'CANCEL_LEAVE', `Cancelled leave request ${leave._id}`, req.ip);

    return res.status(200).json({ success: true, message: 'Leave request cancelled' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  getLeavesByUser,
  getLeaveBalance,
  approveLeave,
  rejectLeave,
  updateLeave,
  cancelLeave,
};
