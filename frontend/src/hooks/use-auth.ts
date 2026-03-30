import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user?.id_user) localStorage.setItem('user_id', data.user.id_user.toString());
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async (userData: Record<string, string>) => {
      const { data } = await api.post('/auth/signup', userData);
      return data;
    },
    onSuccess: (data) => {
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user?.id_user) localStorage.setItem('user_id', data.user.id_user.toString());
    },
  });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  window.location.href = '/login';
};
