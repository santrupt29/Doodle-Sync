import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8765',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch a one-time WebSocket auth ticket from user-service (via gateway).
 * The ticket is valid for 30 seconds and consumed on first use.
 */
export async function fetchWsTicket() {
  const { data } = await api.post('/user/auth/ws-ticket');
  return data.ticket;
}

export default api;