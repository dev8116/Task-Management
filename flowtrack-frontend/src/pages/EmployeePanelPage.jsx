import { useState } from 'react';
import PageTransition from '../layouts/PageTransition';
import WorkLogForm from '../components/employee/WorkLogForm';
import AttendanceMarker from '../components/employee/AttendanceMarker';
import LeaveRequestForm from '../components/employee/LeaveRequestForm';
import PerformanceHistory from '../components/employee/PerformanceHistory';

const TABS = [
  { id: 'worklog', label: 'Work Log' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave Request' },
  { id: 'performance', label: 'Performance' },
];

export default function EmployeePanelPage() {
  const [activeTab, setActiveTab] = useState('worklog');

  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your work and track your progress
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
          {activeTab === 'worklog' && <WorkLogForm />}
          {activeTab === 'attendance' && <AttendanceMarker />}
          {activeTab === 'leave' && <LeaveRequestForm />}
          {activeTab === 'performance' && <PerformanceHistory />}
        </div>
      </div>
    </PageTransition>
  );
}
