import { useState, useEffect } from 'react';

export default function DeadlineCountdown({ deadline }) {
  const [label, setLabel] = useState('');
  const [colorClass, setColorClass] = useState('');

  useEffect(() => {
    if (!deadline) {
      setLabel('No deadline');
      setColorClass('text-gray-400 dark:text-gray-500');
      return;
    }

    const now = new Date();
    // Parse YYYY-MM-DD components explicitly to avoid timezone shifts
    const [year, month, day] = deadline.split('-').map(Number);
    const due = new Date(year, month - 1, day, 23, 59, 59);
    const diffMs = due - now;

    if (diffMs < 0) {
      setLabel('Overdue');
      setColorClass('text-red-600 dark:text-red-400 font-semibold');
      return;
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 2) {
      const hours = Math.floor(diffHours);
      setLabel(`${hours} hour${hours !== 1 ? 's' : ''} left`);
      setColorClass('text-red-600 dark:text-red-400 font-semibold');
    } else if (diffDays < 5) {
      const days = Math.floor(diffDays);
      setLabel(`${days} day${days !== 1 ? 's' : ''} left`);
      setColorClass('text-yellow-600 dark:text-yellow-400 font-semibold');
    } else {
      const days = Math.floor(diffDays);
      setLabel(`${days} day${days !== 1 ? 's' : ''} left`);
      setColorClass('text-green-600 dark:text-green-400');
    }
  }, [deadline]);

  return (
    <span className={`text-xs ${colorClass}`}>{label}</span>
  );
}
