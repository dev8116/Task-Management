import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Auth Pages
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Layout
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import ProjectManagement from './pages/Admin/ProjectManagement';
import AllTasks from './pages/Admin/AllTasks';
import AttendanceManagement from './pages/Admin/AttendanceManagement';
import LeaveManagement from './pages/Admin/LeaveManagement';
import ActivityLogs from './pages/Admin/ActivityLogs';
import Reports from './pages/Admin/Reports';

// Manager Pages
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import ManagerProjects from './pages/Manager/ManagerProjects';
import ManagerTasks from './pages/Manager/ManagerTasks';
import TeamPerformance from './pages/Manager/TeamPerformance';
import TeamAttendance from './pages/Manager/TeamAttendance';
import ManagerLeaves from './pages/Manager/ManagerLeaves';

// Employee Pages
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import MyTasks from './pages/Employee/MyTasks';
import MyAttendance from './pages/Employee/MyAttendance';
import ApplyLeave from './pages/Employee/ApplyLeave';
import MyPerformance from './pages/Employee/MyPerformance';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  const getDashboardRedirect = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'manager': return '/manager/dashboard';
      case 'employee': return '/employee/dashboard';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDashboardRedirect()} /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="tasks" element={<AllTasks />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Manager Routes */}
      <Route path="/manager" element={<ProtectedRoute roles={['manager']}><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="projects" element={<ManagerProjects />} />
        <Route path="tasks" element={<ManagerTasks />} />
        <Route path="team-performance" element={<TeamPerformance />} />
        <Route path="team-attendance" element={<TeamAttendance />} />
        <Route path="leaves" element={<ManagerLeaves />} />
      </Route>

      {/* Employee Routes */}
      <Route path="/employee" element={<ProtectedRoute roles={['employee']}><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leaves" element={<ApplyLeave />} />
        <Route path="performance" element={<MyPerformance />} />
      </Route>

      <Route path="/" element={<Navigate to={getDashboardRedirect()} />} />
      <Route path="*" element={<Navigate to={getDashboardRedirect()} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;