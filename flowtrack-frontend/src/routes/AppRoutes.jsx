import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';

import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import ProjectManagement from '../pages/admin/ProjectManagement';
import ReportsAnalytics from '../pages/admin/ReportsAnalytics';
import AttendanceLeave from '../pages/admin/AttendanceLeave';
import ActivityLogs from '../pages/admin/ActivityLogs';

import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerProjects from '../pages/manager/ManagerProjects';
import TaskManagement from '../pages/manager/TaskManagement';
import TeamPerformance from '../pages/manager/TeamPerformance';
import AttendanceMonitoring from '../pages/manager/AttendanceMonitoring';
import LeaveApproval from '../pages/manager/LeaveApproval';

import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import MyTasks from '../pages/employee/MyTasks';
import Attendance from '../pages/employee/Attendance';
import LeaveRequest from '../pages/employee/LeaveRequest';
import PerformanceDashboard from '../pages/employee/PerformanceDashboard';

import ProfilePage from '../pages/ProfilePage';

export default function AppRoutes() {
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    return `/${user.role}`;
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="attendance" element={<AttendanceLeave />} />
        <Route path="activity" element={<ActivityLogs />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Manager */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<ManagerDashboard />} />
        <Route path="projects" element={<ManagerProjects />} />
        <Route path="tasks" element={<TaskManagement />} />
        <Route path="performance" element={<TeamPerformance />} />
        <Route path="attendance" element={<AttendanceMonitoring />} />
        <Route path="leaves" element={<LeaveApproval />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Employee */}
      <Route path="/employee" element={<ProtectedRoute allowedRoles={['employee']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<LeaveRequest />} />
        <Route path="performance" element={<PerformanceDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}