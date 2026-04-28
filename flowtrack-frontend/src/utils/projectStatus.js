export const STATUS_ADMIN = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled", "Closed"];
export const STATUS_MANAGER = ["Planning", "In Progress", "On Hold", "Completed"];
export const STATUS_EMPLOYEE = [];

export const statusOptionsByRole = (role) => {
  if (role === "admin") return STATUS_ADMIN;
  if (role === "manager") return STATUS_MANAGER;
  return STATUS_EMPLOYEE;
};