import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// attach token if present
API.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('flowtrack_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch (err) {
    console.error('[API] localStorage parse error', err);
  }
  return config;
}, (err) => Promise.reject(err));

// let callers handle 401 (no forced redirect)
API.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default API;