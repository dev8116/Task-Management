export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Earned Leave',
  'Unpaid Leave',
];

export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ANNUAL_LEAVE_ALLOWANCE = 21;

export const DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'HR',
  'Finance',
  'Operations',
];
