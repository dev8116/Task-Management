import React from 'react';
import { FiClock } from 'react-icons/fi';
import './TaskCard.css';

const TaskCard = ({ task, onStatusChange }) => {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={`task-card ${task.priority?.toLowerCase()}`}>
      <div className="task-card-header">
        <span className="task-card-title">{task.title}</span>
        <span className={`priority-badge ${task.priority?.toLowerCase()}`}>{task.priority}</span>
      </div>
      <p className="task-card-desc">{task.description || 'No description'}</p>
      <div className="task-card-meta">
        <span className={`status-badge ${task.status?.toLowerCase().replace(' ', '-')}`}>
          {task.status}
        </span>
        <span className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>
          <FiClock /> {formatDate(task.deadline)}
          {isOverdue && ' (Overdue)'}
        </span>
      </div>
      {onStatusChange && task.status !== 'Completed' && (
        <div style={{ marginTop: '12px' }}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd',
              fontSize: '12px', cursor: 'pointer', width: '100%',
            }}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default TaskCard;