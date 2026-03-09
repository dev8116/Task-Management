export const mockProjects = [
  { id: 'p1', name: 'E-Commerce Platform', description: 'Full-stack e-commerce solution', status: 'In Progress', progress: 65, managerId: null, startDate: '2026-01-15', deadline: '2026-06-30', priority: 'High' },
  { id: 'p2', name: 'CRM System', description: 'Customer relationship management', status: 'In Progress', progress: 40, managerId: null, startDate: '2026-02-01', deadline: '2026-08-15', priority: 'Medium' },
  { id: 'p3', name: 'Mobile App', description: 'Cross-platform mobile application', status: 'Pending', progress: 10, managerId: null, startDate: '2026-03-01', deadline: '2026-09-30', priority: 'High' },
  { id: 'p4', name: 'Analytics Dashboard', description: 'Business intelligence dashboard', status: 'Completed', progress: 100, managerId: null, startDate: '2025-10-01', deadline: '2026-02-28', priority: 'Low' },
];

export const mockTasks = [
  { id: 't1', title: 'Design Login UI', projectId: 'p1', assigneeId: null, status: 'Completed', priority: 'High', deadline: '2026-03-10', description: 'Create login page with responsive design' },
  { id: 't2', title: 'Setup Database Schema', projectId: 'p1', assigneeId: null, status: 'In Progress', priority: 'High', deadline: '2026-03-15', description: 'Design and implement MongoDB schemas' },
  { id: 't3', title: 'API Integration', projectId: 'p2', assigneeId: null, status: 'Pending', priority: 'Medium', deadline: '2026-03-20', description: 'Integrate third-party payment API' },
  { id: 't4', title: 'Testing Module', projectId: 'p2', assigneeId: null, status: 'Pending', priority: 'Low', deadline: '2026-03-25', description: 'Write unit and integration tests' },
  { id: 't5', title: 'Deploy to Production', projectId: 'p3', assigneeId: null, status: 'Pending', priority: 'High', deadline: '2026-04-01', description: 'Setup CI/CD and deploy' },
];

export const mockAttendance = [
  { id: 'a1', userId: null, date: '2026-03-03', checkIn: '09:00', checkOut: '18:00', status: 'Present', hours: 9 },
  { id: 'a2', userId: null, date: '2026-03-04', checkIn: '09:15', checkOut: '17:45', status: 'Present', hours: 8.5 },
  { id: 'a3', userId: null, date: '2026-03-05', checkIn: null, checkOut: null, status: 'Absent', hours: 0 },
];

export const mockLeaves = [
  { id: 'l1', userId: null, type: 'Sick Leave', startDate: '2026-03-10', endDate: '2026-03-11', reason: 'Not feeling well', status: 'Pending' },
  { id: 'l2', userId: null, type: 'Casual Leave', startDate: '2026-03-20', endDate: '2026-03-20', reason: 'Personal work', status: 'Approved' },
];

export const mockActivityLogs = [
  { id: 'log1', user: 'Admin', action: 'Created Manager account', target: 'John Manager', timestamp: '2026-03-05T09:00:00', type: 'user' },
  { id: 'log2', user: 'Admin', action: 'Created new project', target: 'E-Commerce Platform', timestamp: '2026-03-05T09:30:00', type: 'project' },
  { id: 'log3', user: 'John Manager', action: 'Assigned task', target: 'Design Login UI', timestamp: '2026-03-05T10:00:00', type: 'task' },
  { id: 'log4', user: 'Jane Employee', action: 'Checked in', target: 'Attendance', timestamp: '2026-03-05T09:05:00', type: 'attendance' },
  { id: 'log5', user: 'Jane Employee', action: 'Updated task status', target: 'Design Login UI → Completed', timestamp: '2026-03-05T14:00:00', type: 'task' },
];

export const weeklyProductivity = [
  { day: 'Mon', tasks: 12, hours: 8.5 },
  { day: 'Tue', tasks: 15, hours: 9 },
  { day: 'Wed', tasks: 10, hours: 7.5 },
  { day: 'Thu', tasks: 18, hours: 9.5 },
  { day: 'Fri', tasks: 14, hours: 8 },
];

export const monthlyPerformance = [
  { month: 'Oct', completed: 45, assigned: 50 },
  { month: 'Nov', completed: 52, assigned: 55 },
  { month: 'Dec', completed: 48, assigned: 60 },
  { month: 'Jan', completed: 60, assigned: 65 },
  { month: 'Feb', completed: 55, assigned: 58 },
  { month: 'Mar', completed: 30, assigned: 40 },
];