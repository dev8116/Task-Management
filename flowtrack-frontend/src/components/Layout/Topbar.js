import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from '../Common/NotificationDropdown';
import { FiSun, FiMoon, FiBell, FiLogOut } from 'react-icons/fi';
import './Topbar.css';
import { fetchUnreadCount } from '../../api/notifications';

const Topbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const loadUnread = async () => {
    try {
      const { data } = await fetchUnreadCount();
      setUnread(data?.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUnread();
  }, []);

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
        <div className="notif-wrapper">
          <button
            className="notification-btn"
            onClick={() => setOpen((v) => !v)}
          >
            <FiBell />
            {unread > 0 && <span className="notification-badge">{unread}</span>}
          </button>
          <NotificationDropdown open={open} onCountChange={setUnread} />
        </div>
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
    </header>
  );
};

export default Topbar;