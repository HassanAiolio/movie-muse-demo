import { ReactNode, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieSummary } from '@/hooks/use-movies';
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';

interface MovieRowProps {
  title: string;
  subtitle?: ReactNode;
  movies: MovieSummary[] | undefined;
  isLoading?: boolean;
  caption?: (movie: MovieSummary) => string | null | undefined;
}

// Horizontal, swipeable row of movie cards with arrow buttons on desktop.
export function MovieRow({ title, subtitle, movies, isLoading, caption }: MovieRowProps) {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (!isLoading && (!movies || movies.length === 0)) return null;

  return (
    <section className="mb-12" aria-label={title}>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              onClick={() => scroll(direction)}
              aria-label={direction < 0 ? `Scroll ${title} left` : `Scroll ${title} right`}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-muted hover:text-foreground hover:border-primary transition-all"
            >
              {direction < 0 ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-36 sm:w-44 shrink-0">
                <SkeletonCard />
              </div>
            ))
          : movies!.map((movie, i) => (
              <div key={movie.id_movie} className="w-36 sm:w-44 shrink-0 snap-start">
                <MovieCard movie={movie} index={i} caption={caption?.(movie)} />
              </div>
            ))}
      </div>
    </section>
  );
}
