import axiosInstance from '../api/axiosInstance';

export async function getAttendance(userId) {
  try {
    const res = await axiosInstance.get(`/attendance/${userId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function checkIn() {
  try {
    const res = await axiosInstance.post('/attendance/check-in');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function checkOut() {
  try {
    const res = await axiosInstance.post('/attendance/check-out');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getAttendanceByDate(date) {
  try {
    const res = await axiosInstance.get('/attendance/by-date', { params: { date } });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getMonthlyAttendance(userId, month, year) {
  try {
    const res = await axiosInstance.get(`/attendance/${userId}/monthly`, {
      params: { month, year },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}
