import axiosInstance from '../api/axiosInstance';

export async function loginUser(email, password) {
  try {
    const res = await axiosInstance.post('/auth/login', { email, password });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function registerUser(data) {
  try {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function forgotPassword(email) {
  try {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function resetPassword(token, password) {
  try {
    const res = await axiosInstance.post('/auth/reset-password', { token, password });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function verifyOTP(email, otp) {
  try {
    const res = await axiosInstance.post('/auth/verify-otp', { email, otp });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function verifyEmail(token) {
  try {
    const res = await axiosInstance.get(`/auth/verify-email/${token}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}

export async function logoutUser() {
  try {
    const res = await axiosInstance.post('/auth/logout');
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
}
