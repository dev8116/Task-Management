import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import { AjaxProvider, useAjax } from "./context/AjaxContext";
import { configureAjaxHooks } from "./api/axios";
import { DataSyncProvider, useDataSync } from "./context/DataSyncContext";

// Auth Pages
import Login from "./pages/Auth/Login";
import ForgotPasswordMobile from "./pages/Auth/ForgotPasswordMobile";
import ResetPassword from "./pages/Auth/ResetPassword";

// Profile Page
import ProfilePage from "./pages/Profile/ProfilePage";
import './styles/responsive.css';
// Layout
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Common/ProtectedRoute";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserManagement from "./pages/Admin/UserManagement";
import ProjectManagement from "./pages/Admin/ProjectManagement";
import AdminTasks from "./pages/Admin/AdminTasks";
import AttendanceManagement from "./pages/Admin/AttendanceManagement";
import LeaveManagement from "./pages/Admin/LeaveManagement";
import Reports from "./pages/Admin/Reports";
import Goals from "./pages/Admin/Goals";
import ProductivityReport from "./pages/Admin/ProductivityReport";

// Manager Pages
import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import ManagerProjects from "./pages/Manager/ManagerProjects";
import ManagerTasks from "./pages/Manager/ManagerTasks";
import TeamPerformance from "./pages/Manager/TeamPerformance";
import TeamAttendance from "./pages/Manager/TeamAttendance";
import ManagerLeaves from "./pages/Manager/ManagerLeaves";
import ManagerAttendance from "./pages/Manager/ManagerAttendance";

// Employee Pages
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import MyTasks from "./pages/Employee/MyTasks";
import MyAttendance from "./pages/Employee/MyAttendance";
import ApplyLeave from "./pages/Employee/ApplyLeave";
import MyPerformance from "./pages/Employee/MyPerformance";

// Notifications
import NotificationsPage from "./pages/Notifications/NotificationsPage";

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { dataVersion } = useDataSync();

  if (loading) return <div className="loading-screen">Loading...</div>;

  const getDashboardRedirect = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "manager":
        return "/manager/dashboard";
      case "employee":
        return "/employee/dashboard";
      default:
        return "/login";
    }
  };

  return (
    <Routes key={dataVersion}>
      <Route
        path="/login"
        element={user ? <Navigate to={getDashboardRedirect()} /> : <Login />}
      />

      {/* Forgot/Reset Password */}
      <Route path="/forgot-password" element={<ForgotPasswordMobile />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* ─── Admin Routes ─────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="projects" element={<ProjectManagement />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/productivity" element={<ProductivityReport />} />
        <Route path="goals" element={<Goals />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ─── Manager Routes ───────────────────────────────── */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={["manager"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="projects" element={<ManagerProjects />} />
        <Route path="tasks" element={<ManagerTasks />} />
        <Route path="team-performance" element={<TeamPerformance />} />
        <Route path="team-attendance" element={<TeamAttendance />} />
        <Route path="attendance" element={<ManagerAttendance />} />
        <Route path="leaves" element={<ManagerLeaves />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ─── Employee Routes ──────────────────────────────── */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute roles={["employee"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leaves" element={<ApplyLeave />} />
        <Route path="performance" element={<MyPerformance />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ─── Global Notifications (all authenticated roles) ─ */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={["admin", "manager", "employee"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NotificationsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={getDashboardRedirect()} />} />
      <Route path="*" element={<Navigate to={getDashboardRedirect()} />} />
    </Routes>
  );
};

const AjaxBootstrap = ({ children }) => {
  const ajax = useAjax();
  const { logout } = useAuth();

  React.useEffect(() => {
    configureAjaxHooks({
      start: ajax.start,
      stop: ajax.stop,
      unauthorized: () => {
        logout();
        window.location.href = "/login";
      },
    });
  }, []);

  return children;
};

const App = () => (
  <Router>
    <ThemeProvider>
      <AuthProvider>
        <AjaxProvider>
          <AjaxBootstrap>
            <DataSyncProvider>
              <AppRoutes />
              <ToastContainer position="top-right" autoClose={3000} />
            </DataSyncProvider>
          </AjaxBootstrap>
        </AjaxProvider>
      </AuthProvider>
    </ThemeProvider>
  </Router>
);

export default App;