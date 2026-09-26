import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Rate = 1 | -1;

export const useUserRating = (movieId: string | undefined) =>
  useQuery({
    queryKey: ['rating', movieId],
    queryFn: async (): Promise<{ rate: Rate | null }> =>
      (await api.get(`/users/me/ratings/${movieId}`)).data,
    enabled: !!movieId,
  });

// Sets, changes or clears (rate: null) a rating, updating the UI immediately.
export const useSetRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movieId, rate }: { movieId: number; rate: Rate | null }) => {
      if (rate === null) await api.delete(`/users/me/ratings/${movieId}`);
      else await api.put(`/users/me/ratings/${movieId}`, { rate });
    },
    onMutate: async ({ movieId, rate }) => {
      const key = ['rating', String(movieId)];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, { rate });
      return { key, previous };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};
