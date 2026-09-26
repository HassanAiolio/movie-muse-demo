import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserRound } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCard } from '@/components/MovieCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/PageStates';
import { useActor } from '@/hooks/use-movies';
import { tmdbImage } from '@/lib/api';

export default function Actor() {
  const { actorId } = useParams<{ actorId: string }>();
  const navigate = useNavigate();
  const { data: actor, isLoading, isError, refetch } = useActor(actorId);
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = tmdbImage(actor?.image, 'w300');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/home'))}
          className="flex items-center gap-2 mb-8 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {isError ? (
          <ErrorState message="We couldn't find this actor." onRetry={() => refetch()} />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-12 text-center sm:text-left">
              <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-primary/60 bg-card flex items-center justify-center shrink-0">
                {photo && !photoFailed ? (
                  <img src={photo} alt={actor?.actor_name} className="w-full h-full object-cover" onError={() => setPhotoFailed(true)} />
                ) : (
                  <UserRound className="w-12 h-12 text-muted" />
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider text-muted mb-1">Actor</p>
                <h1 className="text-4xl sm:text-5xl text-foreground">
                  {actor?.actor_name ?? <span className="inline-block w-64 h-10 bg-card rounded shimmer relative overflow-hidden" />}
                </h1>
                {actor && (
                  <p className="text-muted mt-2">
                    {actor.movies.length} {actor.movies.length === 1 ? 'film' : 'films'} in the archive
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : actor?.movies.map((movie, i) => <MovieCard key={movie.id_movie} movie={movie} index={i} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
