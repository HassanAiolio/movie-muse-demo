import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Loader2, ThumbsDown, ThumbsUp, Trash2, UserRound } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCard } from '@/components/MovieCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState, ErrorState } from '@/components/PageStates';
import { CountItem, useDeleteAccount, useMyRatings, useStats } from '@/hooks/use-profile';
import { logout } from '@/hooks/use-auth';
import { errorMessage, tmdbImage } from '@/lib/api';
import { getUser } from '@/lib/session';
import { cn } from '@/lib/utils';

function StatTile({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: number | undefined; to?: string }) {
  const body = (
    <div className="bg-card border border-border rounded-2xl p-5 h-full hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 text-muted text-sm mb-2">
        {icon}
        {label}
      </div>
      <p className="font-display text-4xl text-foreground">{value ?? '–'}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

// Single-series horizontal bars: label and count are always visible text,
// so the bar length is a reinforcement, never the only carrier of the value.
function BarList({ title, items, unit }: { title: string; items: CountItem[]; unit: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xl text-foreground mb-5">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="group grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm"
            title={`${item.label}: ${item.count} ${unit}${item.count === 1 ? '' : 's'}`}
          >
            <span className="text-muted group-hover:text-foreground truncate transition-colors">{item.label}</span>
            <span className="h-2.5 rounded-r bg-secondary overflow-hidden">
              <span
                className="block h-full rounded-r bg-primary/85 group-hover:bg-primary transition-colors"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums text-foreground">{item.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DangerZone() {
  const user = getUser();
  const deleteAccount = useDeleteAccount();
  const [confirming, setConfirming] = useState(false);
  const isDemo = user?.email === 'demo@moviemuse.app';

  return (
    <section className="border border-red-500/30 rounded-2xl p-6 mt-16">
      <h2 className="text-xl text-foreground mb-2">Delete account</h2>
      <p className="text-sm text-muted mb-4">
        {isDemo
          ? "This is the shared demo account, so it can't be deleted. Create your own account to keep your ratings."
          : 'Permanently deletes your account, ratings and watchlist. This cannot be undone.'}
      </p>
      {!isDemo &&
        (confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => deleteAccount.mutate(undefined, { onSuccess: logout })}
              disabled={deleteAccount.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-70"
            >
              {deleteAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Yes, delete everything
            </button>
            <button onClick={() => setConfirming(false)} className="px-5 py-2.5 rounded-full border border-border hover:border-foreground/40">
              Cancel
            </button>
            {deleteAccount.isError && <p role="alert" className="text-sm text-red-400 w-full">{errorMessage(deleteAccount.error)}</p>}
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" /> Delete my account
          </button>
        ))}
    </section>
  );
}

export default function Profile() {
  const user = getUser();
  const stats = useStats();
  const ratings = useMyRatings();
  const [tab, setTab] = useState<1 | -1>(1);
  const shown = (ratings.data ?? []).filter((m) => m.rate === tab);
  const s = stats.data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center font-display text-2xl text-primary">
            {user?.firstname?.[0] ?? <UserRound className="w-7 h-7" />}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl text-foreground">
              {user ? `${user.firstname} ${user.lastname}` : 'Your profile'}
            </h1>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>
        </div>

        {stats.isError ? (
          <ErrorState message="We couldn't load your taste profile." onRetry={() => stats.refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <StatTile icon={<ThumbsUp className="w-4 h-4" />} label="Liked" value={s?.likes} />
              <StatTile icon={<ThumbsDown className="w-4 h-4" />} label="Disliked" value={s?.dislikes} />
              <StatTile icon={<Bookmark className="w-4 h-4" />} label="Watchlist" value={s?.watchlist} to="/watchlist" />
            </div>

            {s && s.likes === 0 ? (
              <EmptyState icon={<ThumbsUp className="w-6 h-6" />} title="Your taste profile is empty" action={{ label: 'Start rating films', to: '/first' }}>
                Like a few films and we'll show your favourite genres, decades and actors here.
              </EmptyState>
            ) : (
              s && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {s.genres.length > 0 && <BarList title="Genres you like" items={s.genres} unit="liked film" />}
                  {s.decades.length > 0 && <BarList title="Your decades" items={s.decades} unit="liked film" />}
                </div>
              )
            )}

            {s && s.actors.length > 0 && (
              <section className="bg-card border border-border rounded-2xl p-6 mb-12">
                <h2 className="text-xl text-foreground mb-5">Actors you keep coming back to</h2>
                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                  {s.actors.map((actor) => (
                    <Link key={actor.id} to={`/actor/${actor.id}`} className="flex flex-col items-center gap-2 w-24 shrink-0 group">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border group-hover:border-primary bg-secondary">
                        {actor.image && <img src={tmdbImage(actor.image, 'w185')!} alt="" className="w-full h-full object-cover" loading="lazy" />}
                      </div>
                      <span className="text-xs text-center text-muted group-hover:text-foreground line-clamp-2">{actor.label}</span>
                      <span className="text-[11px] text-muted/80">{actor.count} films</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl sm:text-3xl text-foreground">Your ratings</h2>
            <div role="tablist" className="flex p-1 rounded-full bg-card border border-border">
              {([1, -1] as const).map((value) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    tab === value ? 'bg-primary text-background' : 'text-muted hover:text-foreground'
                  )}
                >
                  {value === 1 ? 'Liked' : 'Disliked'}
                </button>
              ))}
            </div>
          </div>
          {ratings.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : shown.length === 0 ? (
            <p className="text-muted py-8">No {tab === 1 ? 'liked' : 'disliked'} films yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
              {shown.map((movie, i) => <MovieCard key={movie.id_movie} movie={movie} index={i} />)}
            </div>
          )}
        </section>

        <DangerZone />
      </main>
    </div>
  );
}
