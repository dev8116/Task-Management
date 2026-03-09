import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageTransition from '../layouts/PageTransition';
import { useTheme } from '../context/ThemeContext';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic'];

const DEFAULT_NOTIFICATIONS = {
  taskAssigned: true,
  taskUpdated: true,
  leaveApproval: true,
  weeklyReport: false,
  loginAlerts: true,
};

export default function SettingsPage() {
  const { dark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [language, setLanguage] = useState('English');

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem(
      'flowtrack_settings',
      JSON.stringify({ notifications, language })
    );
    toast.success('Settings saved successfully!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const NOTIFICATION_LABELS = {
    taskAssigned: 'New task assigned to me',
    taskUpdated: 'Task status updated',
    leaveApproval: 'Leave request approved or rejected',
    weeklyReport: 'Weekly performance report',
    loginAlerts: 'New login alerts',
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Customize your FlowTrack experience
          </p>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Appearance</h2>
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Switch between light and dark theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                dark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                  dark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Notification Preferences
          </h2>
          <div className="space-y-3 max-w-sm">
            {Object.entries(NOTIFICATION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={() => toggleNotification(key)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Language</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>

      <ToastContainer />
    </PageTransition>
  );
}
