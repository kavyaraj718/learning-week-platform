import axios from 'axios';

// In dev, leave VITE_API_URL blank and rely on the Vite proxy (same origin).
const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

const client = axios.create({ baseURL });

// Attach the JWT on every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('lw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors to a friendly message and auto-logout on 401.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    if (err.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('lw_token');
    }
    return Promise.reject(new Error(message));
  }
);

export default client;
