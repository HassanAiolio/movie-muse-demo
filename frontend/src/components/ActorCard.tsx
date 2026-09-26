import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { CastMember } from '@/hooks/use-movies';
import { tmdbImage } from '@/lib/api';

interface ActorCardProps {
  actor: CastMember;
}

export function ActorCard({ actor }: ActorCardProps) {
  const [failed, setFailed] = useState(false);
  const src = tmdbImage(actor.image, 'w185');

  return (
    <Link
      to={`/actor/${actor.id_actor}`}
      className="flex flex-col items-center gap-3 w-28 shrink-0 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors duration-300 bg-card flex items-center justify-center">
        {src && !failed ? (
          <img
            src={src}
            alt={actor.actor_name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <UserRound className="w-8 h-8 text-muted" />
        )}
      </div>
      <span className="text-sm text-center text-muted group-hover:text-foreground transition-colors line-clamp-2 leading-snug">
        {actor.actor_name}
      </span>
    </Link>
  );
}
