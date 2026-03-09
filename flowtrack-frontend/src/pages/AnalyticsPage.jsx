import { useState, useEffect } from 'react';
import PageTransition from '../layouts/PageTransition';
import WeeklyProductivityChart from '../components/analytics/WeeklyProductivityChart';
import TaskCompletionPieChart from '../components/analytics/TaskCompletionPieChart';
import AttendanceChart from '../components/analytics/AttendanceChart';
import LeaveSummaryStats from '../components/analytics/LeaveSummaryStats';
import PerformanceRankingTable from '../components/analytics/PerformanceRankingTable';
import AnalyticsFilters from '../components/analytics/AnalyticsFilters';
import { getTaskCompletion, getAttendanceStats, getPerformanceRanking } from '../services/analyticsService';

export default function AnalyticsPage() {
  const [filters, setFilters] = useState({ range: 'week', role: 'all' });
  const [taskCompletion, setTaskCompletion] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [performanceRanking, setPerformanceRanking] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const [taskRes, attendanceRes, perfRes] = await Promise.all([
          getTaskCompletion(),
          getAttendanceStats(now.getMonth() + 1, now.getFullYear()),
          getPerformanceRanking(),
        ]);
        setTaskCompletion(taskRes.data || taskRes || []);
        setAttendanceStats(attendanceRes.data || attendanceRes || []);
        setPerformanceRanking(perfRes.data || perfRes || []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setTaskCompletion([]);
        setAttendanceStats([]);
        setPerformanceRanking([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [filters]);

  return (
    <PageTransition>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Track performance and productivity metrics
            </p>
          </div>
        </div>

        <AnalyticsFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Weekly Productivity
                </h2>
                <WeeklyProductivityChart data={attendanceStats} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Task Completion
                </h2>
                <TaskCompletionPieChart data={taskCompletion} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Attendance Overview
                </h2>
                <AttendanceChart />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Leave Summary
                </h2>
                <LeaveSummaryStats />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Performance Rankings
              </h2>
              <PerformanceRankingTable data={performanceRanking} />
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
