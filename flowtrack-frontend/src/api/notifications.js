import API from './axios';

// Fetch latest notifications (limit default 50)
export const fetchNotifications = (limit = 20) =>
  API.get(`/notifications?limit=${limit}`);

// Unread count
export const fetchUnreadCount = () =>
  API.get('/notifications/unread-count');

// Mark one read
export const markNotificationRead = (id) =>
  API.patch(`/notifications/${id}/read`);

// Mark all read
export const markAllNotificationsRead = () =>
  API.patch('/notifications/read-all');

// Delete notification
export const deleteNotification = (id) =>
  API.delete(`/notifications/${id}`);