import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { clearSession, setSession, SessionUser } from '@/lib/session';

interface SessionResponse {
  token: string;
  user: SessionUser;
}

function useSessionMutation<TInput>(request: (input: TInput) => Promise<SessionResponse>) {
  return useMutation({
    mutationFn: request,
    onSuccess: (data) => setSession(data.token, data.user),
  });
}

export const useLogin = () =>
  useSessionMutation(async (credentials: { email: string; password: string }) => {
    const { data } = await api.post<SessionResponse>('/auth/login', credentials);
    return data;
  });

export const useSignup = () =>
  useSessionMutation(
    async (details: { email: string; password: string; firstname: string; lastname: string }) => {
      const { data } = await api.post<SessionResponse>('/auth/signup', details);
      return data;
    }
  );

export const useDemoLogin = () =>
  useSessionMutation(async (_: void) => {
    const { data } = await api.post<SessionResponse>('/auth/demo');
    return data;
  });

export const logout = () => {
  clearSession();
  window.location.href = '/login';
};
