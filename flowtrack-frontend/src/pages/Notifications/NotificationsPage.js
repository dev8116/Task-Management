import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // ✅ Admin sees all notifications; others see only their own
      if (user?.role === 'admin') {
        const { data } = await API.get('/notifications/all?limit=100');
        setItems(data || []);
      } else {
        const { data } = await fetchNotifications(100);
        setItems(data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkOne = async (id) => {
    try {
      // Mark read works only for "my notifications" (user-scoped).
      // Admin viewing /all cannot mark others' notifications read with current backend logic.
      if (user?.role === 'admin') return;

      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) { console.error(err); }
  };

  const handleMarkAll = async () => {
    try {
      if (user?.role === 'admin') return;

      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      if (user?.role === 'admin') return;

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
        <h2>
          Notifications
          {user?.role !== 'admin' && unreadCount > 0 && ` (${unreadCount} unread)`}
          {user?.role === 'admin' && ' (All)'}
        </h2>

        <div className="notif-page-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <button
            onClick={handleMarkAll}
            disabled={user?.role === 'admin' || unreadCount === 0}
            title={user?.role === 'admin' ? 'Admin view is read-only (all notifications)' : ''}
          >
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

              {/* Show extra info for admin */}
              {user?.role === 'admin' && (
                <div className="notif-card-meta">
                  <span>To: <b>{n.user?.name || 'N/A'}</b> ({n.user?.role || '—'})</span>
                  <span>By: <b>{n.actor?.name || 'N/A'}</b> ({n.role || '—'})</span>
                </div>
              )}

              <div className="notif-card-actions">
                {user?.role !== 'admin' && !n.isRead && (
                  <button onClick={() => handleMarkOne(n._id)}>Mark read</button>
                )}
                {user?.role !== 'admin' && (
                  <button className="danger" onClick={() => handleDelete(n._id)}>Delete</button>
                )}

                {user?.role === 'admin' && (
                  <span className="notif-admin-hint">Admin view: read-only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;