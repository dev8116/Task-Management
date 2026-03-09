import { createContext, useContext, useState, useEffect } from 'react';
import { getTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from '../services/taskService';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch tasks if user is logged in
    if (!user) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const data = await getTasks();
        setTasks(data.data || data || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  const addTask = async (task) => {
    setLoading(true);
    try {
      const data = await apiCreateTask(task);
      const newTask = data.data || data;
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, taskData) => {
    setLoading(true);
    try {
      const data = await apiUpdateTask(id, taskData);
      const updated = data.data || data;
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? { ...t, ...updated } : t)));
      return updated;
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    try {
      await apiDeleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTasksByAssignee = (userId) =>
    tasks.filter((task) => task.assignedTo === userId || task.assigneeId === userId);

  const getTasksByStatus = (status) =>
    tasks.filter((task) => task.status === status);

  return (
    <TaskContext.Provider value={{ tasks, loading, addTask, updateTask, deleteTask, getTasksByAssignee, getTasksByStatus }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTaskContext = () => useContext(TaskContext);