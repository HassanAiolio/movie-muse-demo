import { useState } from 'react';
import { Film } from 'lucide-react';
import { tmdbImage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PosterProps {
  path: string | null | undefined;
  title: string;
  size?: 'w185' | 'w300' | 'w500' | 'w780';
  className?: string;
  eager?: boolean;
}

// TMDB poster with a titled placeholder when the image is missing or broken.
export function Poster({ path, title, size = 'w500', className, eager }: PosterProps) {
  const [failed, setFailed] = useState(false);
  const src = tmdbImage(path, size);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-4 text-center bg-gradient-to-br from-card to-secondary',
          className
        )}
      >
        <Film className="w-8 h-8 text-muted/60" />
        <span className="font-display text-foreground/80 leading-tight line-clamp-3">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
