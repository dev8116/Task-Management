import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Notification from '../Common/Notification';
import { FiSun, FiMoon, FiBell, FiLogOut } from 'react-icons/fi';
import API from '../../api/axios';
import './Topbar.css';

const Topbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/activity-logs?limit=5');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h3>Welcome, {user?.name || 'User'}</h3>
      </div>
      <div className="topbar-right">
        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
        <button
          className="notification-btn"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FiBell />
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
        </button>
        <div className="user-profile">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <FiLogOut style={{ marginRight: 4 }} /> Logout
        </button>
      </div>
      {showNotifications && (
        <Notification
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
};

export default Topbar;