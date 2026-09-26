import { Bookmark, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCard } from '@/components/MovieCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState, ErrorState } from '@/components/PageStates';
import { useToggleWatchlist, useWatchlist } from '@/hooks/use-watchlist';

export default function Watchlist() {
  const { data: movies, isLoading, isError, refetch } = useWatchlist();
  const toggle = useToggleWatchlist();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl sm:text-5xl text-foreground mb-2">Your watchlist</h1>
        <p className="text-muted mb-10">
          {movies?.length ? `${movies.length} ${movies.length === 1 ? 'film' : 'films'} waiting for movie night.` : 'Films you want to see, all in one place.'}
        </p>

        {isError ? (
          <ErrorState message="We couldn't load your watchlist." onRetry={() => refetch()} />
        ) : !isLoading && movies?.length === 0 ? (
          <EmptyState icon={<Bookmark className="w-6 h-6" />} title="Nothing saved yet" action={{ label: 'Find something to watch', to: '/home' }}>
            Hit "Add to watchlist" on any film and it will show up here.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : movies!.map((movie, i) => (
                  <div key={movie.id_movie} className="relative group/item">
                    <MovieCard movie={movie} index={i} />
                    <button
                      onClick={() => toggle.mutate({ movie, add: false })}
                      aria-label={`Remove ${movie.title} from watchlist`}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-red-500/80 transition-colors sm:opacity-0 sm:group-hover/item:opacity-100 focus-visible:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
          </div>
        )}
      </main>
    </div>
  );
}
