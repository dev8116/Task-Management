import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api/notifications';
import './NotificationsPage.css';

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

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchNotifications(100);
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) { console.error(err); }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = items.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? !n.isRead : n.isRead
  );

  return (
    <div className="notif-page">
      <div className="notif-page-header">
        <h2>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</h2>
        <div className="notif-page-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button onClick={handleMarkAll} disabled={unreadCount === 0}>
            Mark all as read
          </button>
        </div>
      </div>

      {error && <div className="notif-page-error">{error}</div>}

      {loading ? (
        <div className="notif-page-empty">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="notif-page-empty">No notifications</div>
      ) : (
        <div className="notif-page-list">
          {filtered.map((n) => (
            <div key={n._id} className={`notif-card ${n.isRead ? 'read' : 'unread'}`}>
              <div className="notif-card-row">
                <div className="notif-card-title">{n.title}</div>
                <div className="notif-card-time">{timeAgo(n.createdAt)}</div>
              </div>
              <div className="notif-card-desc">{n.description}</div>
              <div className="notif-card-actions">
                {!n.isRead && <button onClick={() => handleMarkOne(n._id)}>Mark read</button>}
                <button className="danger" onClick={() => handleDelete(n._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;