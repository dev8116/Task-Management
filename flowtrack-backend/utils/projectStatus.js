/**
 * Validate role-based project status transition.
 * @param {string} role - 'admin' | 'manager' | 'employee'
 * @param {string} currentStatus
 * @param {string} newStatus
 * @param {boolean} isAssignedManager - true if req.user._id === project.manager
 * @returns {{ok:boolean, message?:string}}
 */
function validateProjectStatusUpdate(role, currentStatus, newStatus, isAssignedManager) {
  const allowedStatuses = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled", "Closed"];

  if (!allowedStatuses.includes(newStatus)) {
    return { ok: false, message: "Invalid status value." };
  }

  if (role === "employee") {
    return { ok: false, message: "Employees cannot change project status." };
  }

  if (role === "admin") {
    // Admin can set any status; only enforce allowed values already checked
    return { ok: true };
  }

  // Manager rules
  if (role === "manager") {
    if (!isAssignedManager) {
      return { ok: false, message: "Managers can update status only for their own projects." };
    }

    const transitions = {
      Planning: ["In Progress"],
      "In Progress": ["On Hold", "Completed"],
      "On Hold": ["In Progress"],
      Completed: ["Closed"], // manager should not reach here by spec, but keep strictness below
      Cancelled: [], // only admin
      Closed: [],    // only admin
    };

    const allowedNext = transitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      return {
        ok: false,
        message: `Invalid transition for manager: ${currentStatus} → ${newStatus}.`,
      };
    }

    // Managers cannot set Cancelled or Closed (spec)
    if (["Cancelled", "Closed"].includes(newStatus)) {
      return { ok: false, message: "Managers cannot set Cancelled or Closed." };
    }

    return { ok: true };
  }

  return { ok: false, message: "Unknown role." };
}

module.exports = { validateProjectStatusUpdate };