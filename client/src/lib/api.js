import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            .then((res) => {
              const token = res.data?.data?.accessToken;
              setAccessToken(token || null);
              return token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const token = await refreshPromise;
        if (!token) throw error;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
