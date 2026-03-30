import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const TMDB_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_ORIGINAL = 'https://image.tmdb.org/t/p/original';

api.interceptors.response.use((response) => {
  if (Array.isArray(response.data)) {
    response.data = response.data.map((item: any) => ({
      ...item,
      image: item.image ? `${TMDB_BASE}${item.image}` : item.image,
    }));
  } else if (response.data?.image) {
    response.data.image = `${TMDB_ORIGINAL}${response.data.image}`;
  }
  return response;
});

export default api;
