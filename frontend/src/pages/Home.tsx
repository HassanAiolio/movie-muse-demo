import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCard } from '@/components/MovieCard';
import { MovieRow } from '@/components/MovieRow';
import { SkeletonCard } from '@/components/SkeletonCard';
import { GenrePill } from '@/components/GenrePill';
import { ErrorState, ServerWakeNotice } from '@/components/PageStates';
import { MovieSummary, useCatalog, useRecommendations, useSearch } from '@/hooks/use-movies';
import { useGenres } from '@/hooks/use-genres';
import { useDebounced } from '@/hooks/use-delayed';
import { getUser } from '@/lib/session';

const ITEMS_PER_PAGE = 36;
const NEW_RELEASE_WINDOW_DAYS = 180;

const SORTS = {
  popular: { label: 'Most popular', compare: (a: MovieSummary, b: MovieSummary) => (b.popularity ?? 0) - (a.popularity ?? 0) || b.rating_tmdb - a.rating_tmdb },
  rating: { label: 'Highest rated', compare: (a: MovieSummary, b: MovieSummary) => b.rating_tmdb - a.rating_tmdb },
  newest: { label: 'Newest', compare: (a: MovieSummary, b: MovieSummary) => b.release_date.localeCompare(a.release_date) },
  oldest: { label: 'Oldest', compare: (a: MovieSummary, b: MovieSummary) => a.release_date.localeCompare(b.release_date) },
  title: { label: 'A–Z', compare: (a: MovieSummary, b: MovieSummary) => a.title.localeCompare(b.title) },
};
type SortKey = keyof typeof SORTS;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 18) return 'Good evening';
  if (hour < 12) return 'Good morning';
  return 'Good afternoon';
}

function newReleases(movies: MovieSummary[]) {
  const cutoff = new Date(Date.now() - NEW_RELEASE_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const byDate = [...movies].sort(SORTS.newest.compare).filter((m) => m.release_date <= today);
  const recent = byDate.filter((m) => m.release_date >= cutoff);
  return (recent.length >= 8 ? recent : byDate).slice(0, 20);
}

export default function Home() {
  const user = getUser();
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>('popular');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const genreScrollRef = useRef<HTMLDivElement>(null);

  const query = useDebounced(searchInput.trim(), 300);
  const isSearching = query.length >= 2;

  const catalog = useCatalog();
  const recommendations = useRecommendations();
  const search = useSearch(query);
  const { data: genres } = useGenres();

  const movies = catalog.data ?? [];
  const personalised = recommendations.data?.some((m) => m.reason) ?? false;
  const latest = useMemo(() => newReleases(movies), [movies]);
  const popular = useMemo(
    () => movies.filter((m) => m.popularity).sort(SORTS.popular.compare).slice(0, 20),
    [movies]
  );

  const browseList = useMemo(() => {
    const source = isSearching ? search.data ?? [] : [...movies].sort(SORTS[sort].compare);
    if (selectedGenres.length === 0) return source;
    return source.filter((movie) =>
      selectedGenres.every((id) => movie.genres.some((g) => g.id_genre === id))
    );
  }, [isSearching, search.data, movies, sort, selectedGenres]);

  const visibleMovies = browseList.slice(0, visibleCount);
  const hasMore = visibleCount < browseList.length;
  const showRows = !isSearching && selectedGenres.length === 0;
  const gridLoading = catalog.isLoading || (isSearching && search.isLoading);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedGenres([]);
  };

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl text-foreground mb-2">
            {greeting()}
            {user?.firstname ? `, ${user.firstname}` : ''}.
          </h1>
          <p className="text-muted">What are we watching tonight?</p>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <label htmlFor="search" className="sr-only">Search films</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" />
          <input
            id="search"
            type="search"
            className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder='Try "Tom Hanks", "heist with a twist" or "space"'
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-muted hover:text-foreground hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Genre strip */}
        {genres && genres.length > 0 && (
          <div className="flex items-center gap-2 mb-10">
            <button
              onClick={() => genreScrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
              aria-label="Scroll genres left"
              className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full bg-card border border-border text-muted hover:text-foreground hover:border-primary transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div ref={genreScrollRef} className="flex gap-2 overflow-x-auto no-scrollbar">
              {genres.map((genre) => (
                <GenrePill
                  key={genre.id_genre}
                  name={genre.genre_type}
                  isActive={selectedGenres.includes(genre.id_genre)}
                  onClick={() => toggleGenre(genre.id_genre)}
                />
              ))}
            </div>
            <button
              onClick={() => genreScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
              aria-label="Scroll genres right"
              className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full bg-card border border-border text-muted hover:text-foreground hover:border-primary transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <ServerWakeNotice loading={catalog.isLoading} />

        {catalog.isError ? (
          <ErrorState
            message="We couldn't load the film archive."
            onRetry={() => catalog.refetch()}
          />
        ) : (
          <>
            {showRows && (
              <>
                <MovieRow
                  title={personalised ? 'Picked for you' : 'Top rated to start with'}
                  subtitle={
                    personalised
                      ? 'Based on the films you liked. The more you rate, the sharper it gets.'
                      : 'Like a few films and this row becomes yours.'
                  }
                  movies={recommendations.data?.slice(0, 20)}
                  isLoading={recommendations.isLoading}
                  caption={(movie) => (movie.reason ? `Because you liked ${movie.reason.title}` : null)}
                />
                <MovieRow
                  title="New releases"
                  subtitle="Fresh from TMDB, updated daily."
                  movies={latest}
                  isLoading={catalog.isLoading}
                />
                <MovieRow title="Popular right now" movies={popular} isLoading={catalog.isLoading} />
              </>
            )}

            {/* Browse grid */}
            <section aria-label="Browse all films">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl text-foreground">
                    {isSearching ? `Results for "${query}"` : 'Browse the archive'}
                  </h2>
                  {!gridLoading && (
                    <p className="text-sm text-muted mt-1">
                      {browseList.length} {browseList.length === 1 ? 'film' : 'films'}
                    </p>
                  )}
                </div>
                {!isSearching && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm text-muted">Sort by</label>
                    <select
                      id="sort"
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value as SortKey);
                        setVisibleCount(ITEMS_PER_PAGE);
                      }}
                      className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      {Object.entries(SORTS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                {gridLoading
                  ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                  : visibleMovies.map((movie, idx) => (
                      <MovieCard key={movie.id_movie} movie={movie} index={idx % ITEMS_PER_PAGE} />
                    ))}
              </div>

              {!gridLoading && browseList.length === 0 && (
                <div className="py-20 text-center">
                  <h3 className="text-xl font-display text-muted">No films match that.</h3>
                  <button onClick={clearFilters} className="mt-4 text-primary hover:underline">
                    Clear search and filters
                  </button>
                </div>
              )}

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    className="px-8 py-3 bg-secondary text-foreground rounded-full border border-border hover:border-primary hover:text-primary transition-all duration-300 font-medium"
                  >
                    Load more films
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </motion.div>
  );
}
