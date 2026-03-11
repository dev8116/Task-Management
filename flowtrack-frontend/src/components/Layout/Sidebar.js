import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiUsers, FiFolder, FiCheckSquare, FiClock,
  FiCalendar, FiActivity, FiBarChart2, FiUser
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard',      label: 'Dashboard',       icon: <FiHome /> },
    { to: '/admin/users',          label: 'User Management', icon: <FiUsers /> },
    { to: '/admin/projects',       label: 'Projects',        icon: <FiFolder /> },
    { to: '/admin/tasks',          label: 'All Tasks',       icon: <FiCheckSquare /> },
    { to: '/admin/attendance',     label: 'Attendance',      icon: <FiClock /> },
    { to: '/admin/leaves',         label: 'Leave Management',icon: <FiCalendar /> },
    { to: '/admin/activity-logs',  label: 'Activity Logs',   icon: <FiActivity /> },
    { to: '/admin/reports',        label: 'Reports',         icon: <FiBarChart2 /> },
    { to: '/admin/profile',        label: 'My Profile',      icon: <FiUser /> },
  ];

  const managerLinks = [
    { to: '/manager/dashboard',         label: 'Dashboard',        icon: <FiHome /> },
    { to: '/manager/projects',          label: 'My Projects',      icon: <FiFolder /> },
    { to: '/manager/tasks',             label: 'Tasks',            icon: <FiCheckSquare /> },
    { to: '/manager/team-performance',  label: 'Team Performance', icon: <FiBarChart2 /> },
    { to: '/manager/team-attendance',   label: 'Team Attendance',  icon: <FiClock /> },
    { to: '/manager/leaves',            label: 'Leave Requests',   icon: <FiCalendar /> },
    { to: '/manager/profile',           label: 'My Profile',       icon: <FiUser /> },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard',   label: 'Dashboard',      icon: <FiHome /> },
    { to: '/employee/tasks',       label: 'My Tasks',       icon: <FiCheckSquare /> },
    { to: '/employee/attendance',  label: 'Attendance',     icon: <FiClock /> },
    { to: '/employee/leaves',      label: 'Leaves',         icon: <FiCalendar /> },
    { to: '/employee/performance', label: 'My Performance', icon: <FiBarChart2 /> },
    { to: '/employee/profile',     label: 'My Profile',     icon: <FiUser /> },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':    return adminLinks;
      case 'manager':  return managerLinks;
      case 'employee': return employeeLinks;
      default:         return [];
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo-icon">⚡</span>
          <h2>FlowTrack</h2>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">{user?.role?.toUpperCase()} PANEL</div>
          {getLinks().map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;