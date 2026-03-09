import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowtrack_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRedirecting = false;

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Skip redirect if we are already on the login page
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
        localStorage.removeItem('flowtrack_user');
        localStorage.removeItem('flowtrack_token');
        window.location.href = '/login';
        // Reset flag after redirect
        setTimeout(() => { isRedirecting = false; }, 3000);
      }
    }
    return Promise.reject(err);
  }
);

export { axiosInstance };
export default axiosInstance;