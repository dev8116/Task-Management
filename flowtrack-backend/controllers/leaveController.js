const Leave = require('../models/Leave');
const ActivityLog = require('../models/ActivityLog');

// @desc    Apply for leave
// @route   POST /api/leaves
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'APPLY_LEAVE',
      description: `Applied for ${leaveType} from ${startDate} to ${endDate}`,
      entity: 'Leave',
      entityId: leave._id,
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leave requests
// @route   GET /api/leaves
exports.getLeaves = async (req, res) => {
  try {
    let query = {};
    const { status, userId } = req.query;

    if (req.user.role === 'employee') {
      query.user = req.user._id;
    } else if (userId) {
      query.user = userId;
    }

    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('user', 'name email department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject leave
// @route   PUT /api/leaves/:id
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    leave.remarks = remarks || '';
    leave.approvedBy = req.user._id;
    await leave.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE_LEAVE',
      description: `${status} leave request for user`,
      entity: 'Leave',
      entityId: leave._id,
    });

    const updatedLeave = await Leave.findById(leave._id)
      .populate('user', 'name email')
      .populate('approvedBy', 'name');

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};