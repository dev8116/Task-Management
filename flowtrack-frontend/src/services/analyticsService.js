import axiosInstance from '../api/axiosInstance';

export async function getWeeklyProductivity(userId) {
  try {
    const res = await axiosInstance.get(`/analytics/productivity/${userId}/weekly`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getTaskCompletion() {
  try {
    const res = await axiosInstance.get('/analytics/task-completion');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getAttendanceStats(month, year) {
  try {
    const res = await axiosInstance.get('/analytics/attendance-stats', {
      params: { month, year },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getPerformanceRanking() {
  try {
    const res = await axiosInstance.get('/analytics/performance-ranking');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getTeamAnalytics(managerId) {
  try {
    const res = await axiosInstance.get(`/analytics/team/${managerId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}
