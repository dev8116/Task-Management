import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

// Attach JWT token on every request
API.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('flowtrack_user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('flowtrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- localStorage helpers (used until backend is connected) ----
export const localDB = {
  get: (key) => JSON.parse(localStorage.getItem(`flowtrack_${key}`) || '[]'),
  set: (key, data) => localStorage.setItem(`flowtrack_${key}`, JSON.stringify(data)),
  add: (key, item) => {
    const list = localDB.get(key);
    list.push({ ...item, id: item.id || Date.now().toString() });
    localDB.set(key, list);
    return list;
  },
  update: (key, id, data) => {
    const list = localDB.get(key).map(i => i.id === id ? { ...i, ...data } : i);
    localDB.set(key, list);
    return list;
  },
  remove: (key, id) => {
    const list = localDB.get(key).filter(i => i.id !== id);
    localDB.set(key, list);
    return list;
  }
};

export default API;