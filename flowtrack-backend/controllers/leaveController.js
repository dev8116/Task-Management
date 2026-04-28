const Leave = require("../models/Leave");
const User = require("../models/User");
const { notify, getRecipients } = require("../utils/notify");

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

    const actorDoc = await User.findById(req.user._id);
    const recipients = await getRecipients(actorDoc, []); // admins & managers
    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: "APPLY_LEAVE",
      title: "Leave applied",
      description: `${actorDoc.name} applied for ${leaveType} (${startDate} - ${endDate})`,
      entity: "Leave",
      entityId: leave._id,
      recipients,
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
    const { status, userId } = req.query;
    const query = {};

    if (req.user.role === "employee") {
      query.user = req.user._id;
    } else if (userId) {
      query.user = userId;
    }

    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate("user", "name email department")
      .populate("approvedBy", "name")
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
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    leave.status = status;
    leave.remarks = remarks || "";
    leave.approvedBy = req.user._id;
    await leave.save();

    const actorDoc = await User.findById(req.user._id);
    const employee = await User.findById(leave.user);
    const recipients = [leave.user]; // employee receives
    const adminManagers = await getRecipients(actorDoc, []);
    adminManagers.forEach((id) => recipients.push(id));

    await notify({
      actor: req.user._id,
      actorRole: req.user.role,
      action: status === "approved" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
      title: status === "approved" ? "Leave approved" : "Leave rejected",
      description: `${actorDoc.name} ${status} leave for ${employee?.name || "employee"}`,
      entity: "Leave",
      entityId: leave._id,
      recipients,
      relatedUser: leave.user,
    });

    const updatedLeave = await Leave.findById(leave._id)
      .populate("user", "name email")
      .populate("approvedBy", "name");

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};