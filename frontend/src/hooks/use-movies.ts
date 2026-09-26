import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Genre {
  id_genre: number;
  genre_type: string;
  count?: number;
}

export interface CastMember {
  id_actor: number;
  actor_name: string;
  image: string | null;
}

export interface Reason {
  id_movie: number;
  title: string;
  shared: string[];
}

export interface MovieSummary {
  id_movie: number;
  title: string;
  release_date: string;
  image: string | null;
  backdrop: string | null;
  rating_tmdb: number;
  popularity: number | null;
  genres: Genre[];
  reason?: Reason | null;
  shared?: string[];
  rate?: 1 | -1;
}

export interface Movie extends MovieSummary {
  description: string;
  tagline: string | null;
  trailer: string | null;
  runtime: number | null;
  vote_count: number | null;
  cast: CastMember[];
}

export interface Provider {
  id: number;
  name: string;
  logo: string;
}

export interface Providers {
  region: string;
  configured?: boolean;
  link: string | null;
  flatrate: Provider[];
  rent: Provider[];
  buy: Provider[];
}

export interface ActorDetails extends CastMember {
  movies: MovieSummary[];
}

async function get<T>(url: string, params?: Record<string, unknown>) {
  return (await api.get<T>(url, { params })).data;
}

export const useCatalog = () =>
  useQuery({
    queryKey: ['catalog'],
    queryFn: () => get<MovieSummary[]>('/movies'),
    staleTime: 10 * 60 * 1000,
  });

export const useRecommendations = () =>
  useQuery({
    queryKey: ['recommendations'],
    queryFn: () => get<MovieSummary[]>('/movies/recommend', { limit: 40 }),
  });

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => get<MovieSummary[]>('/movies/search', { q: query, limit: 60 }),
    enabled: query.length >= 2,
    placeholderData: (previous) => previous,
  });

export const useMovie = (movieId: string | undefined) =>
  useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => get<Movie>(`/movies/${movieId}`),
    enabled: !!movieId,
  });

export const useSimilar = (movieId: string | undefined) =>
  useQuery({
    queryKey: ['similar', movieId],
    queryFn: () => get<MovieSummary[]>(`/movies/${movieId}/similar`, { limit: 12 }),
    enabled: !!movieId,
  });

export const useProviders = (movieId: string | undefined, region = 'FR') =>
  useQuery({
    queryKey: ['providers', movieId, region],
    queryFn: () => get<Providers>(`/movies/${movieId}/providers`, { region }),
    enabled: !!movieId,
    staleTime: 60 * 60 * 1000,
  });

export const useActor = (actorId: string | undefined) =>
  useQuery({
    queryKey: ['actor', actorId],
    queryFn: () => get<ActorDetails>(`/actors/${actorId}`),
    enabled: !!actorId,
  });
