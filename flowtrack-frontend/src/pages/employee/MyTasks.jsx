import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TaskCard from '../../components/TaskCard';
import SearchFilter from '../../components/SearchFilter';
import { getTasksByAssignee, updateTask } from '../../services/taskService';

export default function MyTasks() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await getTasksByAssignee(user._id || user.id);
      setMyTasks(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setMyTasks((prev) => prev.map((t) => (t._id === taskId || t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const filtered = myTasks.filter((t) => {
    const matchSearch = (t.title || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const pending = filtered.filter((t) => t.status === 'Pending');
  const inProgress = filtered.filter((t) => t.status === 'In Progress');
  const completed = filtered.filter((t) => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {myTasks.length} tasks assigned to you
        </p>
      </div>

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tasks..."
        filters={[
          {
            key: 'status',
            label: 'All Status',
            value: statusFilter,
            options: ['Pending', 'In Progress', 'Completed'],
          },
          {
            key: 'priority',
            label: 'All Priority',
            value: priorityFilter,
            options: ['High', 'Medium', 'Low'],
          },
        ]}
        onFilterChange={(key, val) => {
          if (key === 'status') setStatusFilter(val);
          if (key === 'priority') setPriorityFilter(val);
        }}
      />

      {filtered.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          No tasks found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Pending ({pending.length})
              </h3>
            </div>
            <div className="space-y-3">
              {pending.map((t) => (
                <TaskCard
                  key={t._id || t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {pending.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No pending tasks
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                In Progress ({inProgress.length})
              </h3>
            </div>
            <div className="space-y-3">
              {inProgress.map((t) => (
                <TaskCard
                  key={t._id || t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {inProgress.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No tasks in progress
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Completed ({completed.length})
              </h3>
            </div>
            <div className="space-y-3">
              {completed.map((t) => (
                <TaskCard
                  key={t._id || t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {completed.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No completed tasks
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
