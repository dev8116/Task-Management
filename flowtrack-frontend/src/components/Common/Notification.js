import React from 'react';
import { FiX } from 'react-icons/fi';
import './Notification.css';

const Notification = ({ notifications, onClose }) => {
  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <span>Notifications</span>
        <button className="notification-close" onClick={onClose}><FiX /></button>
      </div>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No notifications
          </div>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="notification-item">
              <div className="notification-action">{n.action?.replace(/_/g, ' ')}</div>
              <div className="notification-desc">{n.description}</div>
              <div className="notification-time">{timeAgo(n.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;