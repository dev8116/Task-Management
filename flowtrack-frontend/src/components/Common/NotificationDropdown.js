import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/notifications';
import './NotificationDropdown.css';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationDropdown = ({ open, onCountChange }) => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const syncCount = (count) => {
    setUnreadCount(count);
    if (onCountChange) onCountChange(count);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        fetchNotifications(10),
        fetchUnreadCount(),
      ]);
      setItems(listRes.data || []);
      syncCount(countRes.data?.count || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchUnreadCount()
        .then(({ data }) => syncCount(data?.count || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      syncCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      syncCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <span>Notifications</span>
        <button onClick={handleMarkAll} disabled={!unreadCount}>
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="notif-empty">Loading...</div>
      ) : items.length === 0 ? (
        <div className="notif-empty">No notifications</div>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li
              key={n._id}
              className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
              onClick={() => handleMarkOne(n._id)}
            >
              <div className="notif-title">{n.title}</div>
              <div className="notif-desc">{n.description}</div>
              <div className="notif-time">{timeAgo(n.createdAt)}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="notif-footer">
        <button
          type="button"
          className="notif-link-btn"
          onClick={() => navigate('/notifications')}
        >
          View all
        </button>
        {unreadCount > 0 && <span className="notif-count">{unreadCount} unread</span>}
      </div>
    </div>
  );
};

export default NotificationDropdown;