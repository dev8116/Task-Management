export const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export const getInitials = (name) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '??';

export const getPriorityClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'badge-high';
    case 'medium': return 'badge-medium';
    case 'low': return 'badge-low';
    default: return 'badge-medium';
  }
};

export const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'status-pending';
    case 'in progress': return 'status-progress';
    case 'completed': return 'status-completed';
    default: return 'status-pending';
  }
};

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const todayStr = () => new Date().toISOString().split('T')[0];