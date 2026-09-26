import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MovieSummary } from './use-movies';

export const useWatchlist = () =>
  useQuery({
    queryKey: ['watchlist'],
    queryFn: async (): Promise<MovieSummary[]> => (await api.get('/users/me/watchlist')).data,
  });

export const useToggleWatchlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movie, add }: { movie: MovieSummary; add: boolean }) => {
      if (add) await api.put(`/users/me/watchlist/${movie.id_movie}`);
      else await api.delete(`/users/me/watchlist/${movie.id_movie}`);
    },
    onMutate: async ({ movie, add }) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist'] });
      const previous = queryClient.getQueryData<MovieSummary[]>(['watchlist']);
      queryClient.setQueryData<MovieSummary[]>(['watchlist'], (list = []) =>
        add
          ? [movie, ...list.filter((m) => m.id_movie !== movie.id_movie)]
          : list.filter((m) => m.id_movie !== movie.id_movie)
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['watchlist'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};
