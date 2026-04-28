import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach token from sessionStorage (tab-scoped) or localStorage (legacy)
API.interceptors.request.use(
  (config) => {
    try {
      const rawSession = sessionStorage.getItem('flowtrack_user');
      const rawLocal = localStorage.getItem('flowtrack_user');
      const raw = rawSession || rawLocal;
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (err) {
      console.error('[API] storage parse error', err);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Let callers handle errors (including 401)
API.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default API;