import axiosInstance from '../api/axiosInstance';

export async function getLeaves(userId) {
  try {
    const res = await axiosInstance.get(`/leaves/${userId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function applyLeave(data) {
  try {
    const res = await axiosInstance.post('/leaves', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function approveLeave(id) {
  try {
    const res = await axiosInstance.patch(`/leaves/${id}/approve`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function rejectLeave(id) {
  try {
    const res = await axiosInstance.patch(`/leaves/${id}/reject`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getLeaveBalance(userId) {
  try {
    const res = await axiosInstance.get(`/leaves/${userId}/balance`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getAllLeaves() {
  try {
    const res = await axiosInstance.get('/leaves');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}
