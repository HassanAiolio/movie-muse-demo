import { Link } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-center px-4">
      <Clapperboard className="w-12 h-12 text-primary mb-6" />
      <p className="text-sm uppercase tracking-[0.3em] text-muted mb-3">Error 404</p>
      <h1 className="text-4xl sm:text-5xl text-foreground mb-4">This scene was cut.</h1>
      <p className="text-muted max-w-md mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link
        to="/"
        className="px-6 py-3 rounded-full bg-primary text-background font-semibold hover:bg-primary-hover transition-colors"
      >
        Back to the archive
      </Link>
    </div>
  );
}
