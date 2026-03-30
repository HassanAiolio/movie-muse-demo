import { Actor } from '@/hooks/use-movies';

interface ActorCardProps {
  actor: Actor;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

export function ActorCard({ actor }: ActorCardProps) {
  const imagePath = actor.image || '';
  const imageUrl = imagePath
    ? `${TMDB_IMAGE_BASE}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
    : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80`;

  return (
    <div className="flex flex-col items-center gap-3 w-28 shrink-0 group">
      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors duration-300">
        <img
          src={imageUrl}
          alt={actor.actor_name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80`;
          }}
        />
      </div>
      <span className="text-sm text-center text-muted group-hover:text-foreground transition-colors line-clamp-2 leading-snug">
        {actor.actor_name}
      </span>
    </div>
  );
}
