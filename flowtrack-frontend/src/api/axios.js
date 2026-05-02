import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Hooks installed once from App
let ajaxStart = null;
let ajaxStop = null;
let onUnauthorized = null;

export const configureAjaxHooks = ({ start, stop, unauthorized }) => {
  ajaxStart = start;
  ajaxStop = stop;
  onUnauthorized = unauthorized;
};

API.interceptors.request.use(
  (config) => {
    const isBackground = !!config?.meta?.background;
    if (!isBackground && ajaxStart) ajaxStart();

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
  (err) => {
    // request failed before sending
    if (ajaxStop) ajaxStop();
    return Promise.reject(err);
  }
);

API.interceptors.response.use(
  (res) => {
    const isBackground = !!res?.config?.meta?.background;
    if (!isBackground && ajaxStop) ajaxStop();
    return res;
  },
  (err) => {
    const isBackground = !!err?.config?.meta?.background;
    if (!isBackground && ajaxStop) ajaxStop();

    if (err?.response?.status === 401 && onUnauthorized) {
      try { onUnauthorized(err); } catch (_) {}
    }

    return Promise.reject(err);
  }
);

export default API;