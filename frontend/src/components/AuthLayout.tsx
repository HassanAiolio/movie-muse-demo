import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCatalog } from '@/hooks/use-movies';
import { tmdbImage } from '@/lib/api';
import logo from '@/assets/logo.svg';

interface AuthLayoutProps {
  headline: ReactNode;
  tagline: string;
  children: ReactNode;
}

// Split screen: a random film from the catalogue on the left, the form on the
// right. Loading the catalogue here also warms the cache for the home page.
export function AuthLayout({ headline, tagline, children }: AuthLayoutProps) {
  const { data: movies } = useCatalog();

  const background = useMemo(() => {
    const withBackdrop = (movies ?? []).filter((m) => m.backdrop && m.rating_tmdb >= 7.5);
    if (withBackdrop.length > 0) {
      const pick = withBackdrop[Math.floor(Math.random() * withBackdrop.length)];
      return tmdbImage(pick.backdrop, 'w1280');
    }
    const withPoster = (movies ?? []).filter((m) => m.image);
    if (withPoster.length === 0) return null;
    return tmdbImage(withPoster[Math.floor(Math.random() * withPoster.length)].image, 'w780');
  }, [movies]);

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
        {background && (
          <motion.img
            key={background}
            src={background}
            alt=""
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="relative z-20 flex flex-col justify-center px-16 h-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <img src={logo} alt="MovieMuse" className="h-24 w-auto mb-6" />
            <h1 className="font-display text-5xl xl:text-6xl text-white mb-6 leading-tight">{headline}</h1>
            <p className="text-lg text-white/70 max-w-md font-light">{tagline}</p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logo} alt="MovieMuse" className="h-10 w-auto" />
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all';

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
      {message}
    </div>
  );
}
