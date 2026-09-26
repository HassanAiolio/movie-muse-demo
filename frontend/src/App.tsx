import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { MotionConfig } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { hasValidSession } from '@/lib/session';

// Each page is its own chunk, so the login screen doesn't ship the whole app.
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const First = lazy(() => import('@/pages/First'));
const Home = lazy(() => import('@/pages/Home'));
const MovieDetails = lazy(() => import('@/pages/MovieDetails'));
const Actor = lazy(() => import('@/pages/Actor'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));
const Profile = lazy(() => import('@/pages/Profile'));
const NotFound = lazy(() => import('@/pages/not-found'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Keep retrying while a sleeping backend boots (network error or 503),
      // but fail fast on real errors like 404.
      retry: (failureCount, error) => {
        if (!isAxiosError(error)) return false;
        const status = error.response?.status;
        const waking = !error.response || status === 503 || status === 502;
        return waking && failureCount < 12;
      },
      retryDelay: 5000,
    },
  },
});

function LegacyMovieRedirect() {
  const { movieId } = useParams();
  return <Navigate to={`/movie/${movieId}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return <div className="min-h-screen bg-background" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to={hasValidSession() ? '/home' : '/login'} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/first" element={<First />} />
              <Route path="/home" element={<Home />} />
              <Route path="/movie/:movieId" element={<MovieDetails />} />
              <Route path="/movieDetails/:movieId" element={<LegacyMovieRedirect />} />
              <Route path="/actor/:actorId" element={<Actor />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </MotionConfig>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
