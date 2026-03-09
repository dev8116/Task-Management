import axiosInstance from '../api/axiosInstance';

export async function getProfile() {
  try {
    const res = await axiosInstance.get('/users/profile');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function updateProfile(data) {
  try {
    const res = await axiosInstance.put('/users/profile', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getAllUsers() {
  try {
    const res = await axiosInstance.get('/users');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function getUserById(id) {
  try {
    const res = await axiosInstance.get(`/users/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function createUser(data) {
  try {
    const res = await axiosInstance.post('/users', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function updateUser(id, data) {
  try {
    const res = await axiosInstance.put(`/users/${id}`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function deleteUser(id) {
  try {
    const res = await axiosInstance.delete(`/users/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}
