import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Coffee } from 'lucide-react';
import { useDelayed } from '@/hooks/use-delayed';

// The backend runs on a free Render instance that sleeps when idle; the first
// request can take up to a minute. Say so instead of spinning silently.
export function ServerWakeNotice({ loading }: { loading: boolean }) {
  const slow = useDelayed(loading, 4000);
  if (!slow) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 p-4 mb-8 rounded-xl border border-primary/30 bg-primary/5 text-sm text-foreground/90"
    >
      <Coffee className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <p>
        <span className="font-semibold">Waking up the server…</span> MovieMuse runs on free hosting
        that naps when nobody's around. The first load can take up to a minute; after that it's instant.
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-20 flex flex-col items-center text-center gap-4">
      <AlertTriangle className="w-10 h-10 text-primary" />
      <p className="text-muted max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: { label: string; to: string };
}) {
  return (
    <div className="py-20 flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-primary">
        {icon}
      </div>
      <h2 className="text-2xl text-foreground mt-2">{title}</h2>
      {children && <p className="text-muted max-w-md">{children}</p>}
      {action && (
        <Link
          to={action.to}
          className="mt-3 px-6 py-3 rounded-full bg-primary text-background font-semibold hover:bg-primary-hover transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
