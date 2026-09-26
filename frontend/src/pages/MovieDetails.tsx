import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  ExternalLink,
  Play,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { Movie, Provider, useMovie, useProviders, useSimilar } from '@/hooks/use-movies';
import { Rate, useSetRating, useUserRating } from '@/hooks/use-ratings';
import { useToggleWatchlist, useWatchlist } from '@/hooks/use-watchlist';
import { useToast } from '@/hooks/use-toast';
import { ActorCard } from '@/components/ActorCard';
import { MovieRow } from '@/components/MovieRow';
import { Poster } from '@/components/Poster';
import { TrailerModal } from '@/components/TrailerModal';
import { ErrorState } from '@/components/PageStates';
import { errorMessage, tmdbImage } from '@/lib/api';
import { formatRating, formatRuntime, yearOf } from '@/lib/format';
import { cn } from '@/lib/utils';

function RatingButtons({ movieId }: { movieId: string }) {
  const { data } = useUserRating(movieId);
  const setRating = useSetRating();
  const { toast } = useToast();
  const current = data?.rate ?? null;

  const rate = (value: Rate) =>
    setRating.mutate(
      { movieId: Number(movieId), rate: current === value ? null : value },
      {
        onError: (error) =>
          toast({ title: "Couldn't save your rating", description: errorMessage(error), variant: 'destructive' }),
      }
    );

  const options = [
    { value: 1 as const, label: 'Like', Icon: ThumbsUp, active: 'bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/20', hover: 'hover:border-green-500/50 hover:text-green-400' },
    { value: -1 as const, label: 'Dislike', Icon: ThumbsDown, active: 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/20', hover: 'hover:border-red-500/50 hover:text-red-400' },
  ];

  return (
    <div className="flex gap-4">
      {options.map(({ value, label, Icon, active, hover }) => (
        <button
          key={value}
          onClick={() => rate(value)}
          aria-pressed={current === value}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-300',
            current === value ? active : cn('bg-secondary border-border text-muted', hover)
          )}
        >
          <Icon className={cn('w-8 h-8', current === value && 'fill-current')} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

function WatchlistButton({ movie }: { movie: Movie }) {
  const { data: watchlist } = useWatchlist();
  const toggle = useToggleWatchlist();
  const { toast } = useToast();
  const saved = watchlist?.some((m) => m.id_movie === movie.id_movie) ?? false;

  return (
    <button
      onClick={() =>
        toggle.mutate(
          { movie, add: !saved },
          { onError: (error) => toast({ title: "Couldn't update your watchlist", description: errorMessage(error), variant: 'destructive' }) }
        )
      }
      aria-pressed={saved}
      className={cn(
        'w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold border transition-colors',
        saved
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-card border-border text-foreground hover:border-primary hover:text-primary'
      )}
    >
      {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
      {saved ? 'In your watchlist' : 'Add to watchlist'}
    </button>
  );
}

function ProviderGroup({ label, providers }: { label: string; providers: Provider[] }) {
  if (providers.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <img
            key={p.id}
            src={tmdbImage(p.logo, 'w185')!}
            alt={p.name}
            title={p.name}
            loading="lazy"
            className="w-10 h-10 rounded-lg border border-border"
          />
        ))}
      </div>
    </div>
  );
}

function WhereToWatch({ movieId }: { movieId: string }) {
  const { data, isLoading } = useProviders(movieId);
  if (isLoading || !data || data.configured === false) return null;
  const empty = data.flatrate.length + data.rent.length + data.buy.length === 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
      <h2 className="font-sans text-sm uppercase tracking-wider text-muted font-bold">Where to watch in France</h2>
      {empty ? (
        <p className="text-sm text-muted">Not available to stream, rent or buy in France right now.</p>
      ) : (
        <>
          <ProviderGroup label="Stream" providers={data.flatrate} />
          <ProviderGroup label="Rent" providers={data.rent} />
          <ProviderGroup label="Buy" providers={data.buy} />
        </>
      )}
      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted">
        <span>Data by JustWatch</span>
        {data.link && (
          <a href={data.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
            All options <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function MovieDetails() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const closeTrailer = useCallback(() => setTrailerOpen(false), []);
  const [heroFailed, setHeroFailed] = useState(false);

  const { data: movie, isLoading, isError, error, refetch } = useMovie(movieId);
  const { data: similar, isLoading: similarLoading } = useSimilar(movieId);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/home'));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (isError || !movie) {
    const notFound = (error as { response?: { status?: number } } | null)?.response?.status === 404;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground px-4">
        {notFound ? (
          <>
            <h2 className="text-2xl font-display mb-4">Film not found</h2>
            <button onClick={() => navigate('/home')} className="text-primary hover:underline">
              Back to the archive
            </button>
          </>
        ) : (
          <ErrorState message="We couldn't load this film." onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  const year = yearOf(movie.release_date);
  const runtime = formatRuntime(movie.runtime);
  const rating = formatRating(movie.rating_tmdb);
  const posterHero = tmdbImage(movie.image, 'w780');
  const heroImage = (!heroFailed && tmdbImage(movie.backdrop, 'w1280')) || posterHero;
  const usingBackdrop = heroImage !== posterHero;

  return (
    <motion.div
      className="min-h-screen bg-background pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[440px] w-full overflow-hidden">
        <div className={cn('absolute inset-0 z-10', usingBackdrop ? 'bg-black/50' : 'bg-black/70')} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            onError={(e) => (usingBackdrop ? setHeroFailed(true) : (e.currentTarget.style.display = 'none'))}
            className={cn('absolute inset-0 w-full h-full object-cover', usingBackdrop ? 'object-center' : 'object-top blur-[4px] scale-105')}
          />
        )}

        <button
          onClick={goBack}
          className="absolute top-6 sm:top-8 left-4 sm:left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full glass text-white/80 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-7xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row md:items-end gap-6 md:gap-10"
          >
            <Poster
              path={movie.image}
              title={movie.title}
              eager
              className="w-32 md:w-48 aspect-[2/3] rounded-lg shadow-2xl shadow-black/50 border border-white/10 hidden sm:flex"
            />

            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-white mb-2 leading-tight drop-shadow-lg">
                {movie.title}
              </h1>
              {movie.tagline && <p className="text-white/70 italic mb-4 text-lg">{movie.tagline}</p>}

              <div className="flex flex-wrap items-center gap-3 text-white/85 text-sm sm:text-base font-medium mb-4">
                {year && (
                  <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm">
                    <Calendar className="w-4 h-4" /> {year}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm">
                    <Clock className="w-4 h-4" /> {runtime}
                  </span>
                )}
                {rating && (
                  <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-md backdrop-blur-sm">
                    <Star className="w-4 h-4 text-primary fill-primary" /> {rating} / 10
                  </span>
                )}
              </div>

              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <span key={g.id_genre} className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs sm:text-sm backdrop-blur-md">
                      {g.genre_type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 min-w-0 space-y-12">
            <section>
              <h2 className="text-2xl font-display text-foreground mb-4 border-b border-border pb-2">Synopsis</h2>
              <p className="text-muted leading-relaxed text-lg">
                {movie.description || 'No synopsis available for this film.'}
              </p>
            </section>

            {movie.cast.length > 0 && (
              <section>
                <h2 className="text-2xl font-display text-foreground mb-6 border-b border-border pb-2">Cast</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                  {movie.cast.map((actor) => (
                    <ActorCard key={actor.id_actor} actor={actor} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h2 className="font-sans text-sm uppercase tracking-wider text-muted font-bold mb-4">Your rating</h2>
              <RatingButtons movieId={String(movie.id_movie)} />
            </div>

            <WatchlistButton movie={movie} />

            {movie.trailer && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-foreground text-background font-bold rounded-2xl hover:bg-primary transition-colors shadow-lg"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch trailer
              </button>
            )}

            <WhereToWatch movieId={String(movie.id_movie)} />
          </aside>
        </div>

        <div className="mt-20 pt-10 border-t border-border">
          <MovieRow
            title="More like this"
            movies={similar}
            isLoading={similarLoading}
            caption={(m) => (m.shared?.length ? m.shared.join(' · ') : null)}
          />
        </div>
      </div>

      <TrailerModal
        videoKey={movie.trailer}
        title={movie.title}
        open={trailerOpen}
        onClose={closeTrailer}
      />
    </motion.div>
  );
}
