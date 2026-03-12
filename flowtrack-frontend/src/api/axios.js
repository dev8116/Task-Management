import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Request interceptor: safely read token from localStorage and attach Authorization header
API.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('flowtrack_user');
    if (raw) {
      const user = JSON.parse(raw);
      // DEBUG: remove or comment out this next line after confirming headers are attached
      console.log('[API] attaching token?', !!user?.token, user?.token?.slice?.(0, 10));
      if (user?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } else {
      // DEBUG: no user in localStorage
      console.log('[API] no flowtrack_user in localStorage');
    }
  } catch (err) {
    console.error('[API] localStorage parse error', err);
  }
  return config;
}, (err) => Promise.reject(err));

// Response interceptor: handle 401 centrally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token invalid/expired — clear state and redirect to login
      localStorage.removeItem('flowtrack_user');
      // optional: show friendly message before redirect
      // window.alert('Session expired. Please log in again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;