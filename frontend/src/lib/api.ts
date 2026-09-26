import axios, { AxiosError } from 'axios';
import { clearSession, getToken } from '@/lib/session';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or revoked session sends the user back to the login page.
api.interceptors.response.use(undefined, (error: AxiosError) => {
  const isAuthCall = error.config?.url?.startsWith('/auth/');
  if (error.response?.status === 401 && !isAuthCall) {
    clearSession();
    window.location.assign('/login?expired=1');
  }
  return Promise.reject(error);
});

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (!error.response) return 'Unable to reach the server. Check your connection and try again.';
  }
  return fallback;
}

type ImageSize = 'w185' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original';

export function tmdbImage(path: string | null | undefined, size: ImageSize = 'w500') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export default api;
