import axiosInstance from '../api/axiosInstance';

export async function getTasks() {
  try {
    const res = await axiosInstance.get('/tasks');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getTaskById(id) {
  try {
    const res = await axiosInstance.get(`/tasks/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function createTask(data) {
  try {
    const res = await axiosInstance.post('/tasks', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function updateTask(id, data) {
  try {
    const res = await axiosInstance.put(`/tasks/${id}`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function deleteTask(id) {
  try {
    const res = await axiosInstance.delete(`/tasks/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getTasksByProject(projectId) {
  try {
    const res = await axiosInstance.get(`/tasks/project/${projectId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getTasksByAssignee(userId) {
  try {
    const res = await axiosInstance.get(`/tasks/assignee/${userId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}
