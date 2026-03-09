import { useState, useEffect } from 'react';
import PageTransition from '../layouts/PageTransition';
import AssignTask from '../components/manager/AssignTask';
import TimeTracker from '../components/manager/TimeTracker';
import ExportReport from '../components/manager/ExportReport';
import WeeklyReport from '../components/manager/WeeklyReport';
import { getTasks } from '../services/taskService';
import { getAllUsers } from '../services/userService';
import axiosInstance from '../api/axiosInstance';

const TABS = [
  { id: 'assign', label: 'Assign Tasks' },
  { id: 'time', label: 'Time Tracker' },
  { id: 'export', label: 'Export Reports' },
  { id: 'weekly', label: 'Weekly Report' },
];

export default function ManagerPanelPage() {
  const [activeTab, setActiveTab] = useState('assign');
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes, projectsRes] = await Promise.all([
          getTasks(),
          getAllUsers(),
          axiosInstance.get('/projects'),
        ]);
        setTasks(tasksRes.data || tasksRes || []);
        const allUsers = usersRes.data || usersRes || [];
        setEmployees(allUsers.filter((u) => u.role === 'employee'));
        setProjects(projectsRes.data?.data || projectsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch panel data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your team and track progress
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          {activeTab === 'assign' && (
            <AssignTask tasks={tasks} employees={employees} />
          )}
          {activeTab === 'time' && (
            <TimeTracker data={[]} />
          )}
          {activeTab === 'export' && (
            <ExportReport data={tasks} />
          )}
          {activeTab === 'weekly' && (
            <WeeklyReport weekData={{}} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
