import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { useDemoLogin, useLogin } from '@/hooks/use-auth';
import { AuthLayout, FormError, inputClass } from '@/components/AuthLayout';
import { errorMessage } from '@/lib/api';
import { hasValidSession, isDemoSession } from '@/lib/session';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  // Checked once on mount: re-checking after sign-in would race the navigate() below.
  const [alreadySignedIn] = useState(hasValidSession);
  const location = useLocation();
  const [params] = useSearchParams();
  const loginMutation = useLogin();
  const demoMutation = useDemoLogin();

  const destination = (location.state as { from?: string } | null)?.from || '/home';

  if (alreadySignedIn) return <Navigate to={destination} replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The demo account is reset on every sign-in, so it always starts on the picker.
    loginMutation.mutate(
      { email, password },
      { onSuccess: (data) => navigate(isDemoSession(data.user) ? '/first' : destination, { replace: true }) }
    );
  };

  const tryDemo = () => demoMutation.mutate(undefined, { onSuccess: () => navigate('/first', { replace: true }) });

  const busy = loginMutation.isPending || demoMutation.isPending;
  const error = loginMutation.isError
    ? errorMessage(loginMutation.error, 'Invalid email or password.')
    : demoMutation.isError
      ? errorMessage(demoMutation.error, "The demo isn't available right now.")
      : params.get('expired')
        ? 'Your session expired. Please sign in again.'
        : null;

  return (
    <AuthLayout
      headline={<>Your personal <br /><span className="text-primary italic">film archive.</span></>}
      tagline="Rate what you've seen. Get films picked for your taste, with the reason for each pick."
    >
      <h2 className="font-display text-3xl text-foreground mb-2">Welcome back</h2>
      <p className="text-muted mb-8">Sign in to pick up where you left off.</p>

      <button
        type="button"
        onClick={tryDemo}
        disabled={busy}
        className="w-full py-3.5 mb-6 flex justify-center items-center gap-2 rounded-xl border border-primary/60 bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors disabled:opacity-70"
      >
        {demoMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        Try the demo, no sign-up needed
      </button>

      <div className="flex items-center gap-4 mb-6 text-xs uppercase tracking-wider text-muted">
        <div className="h-px flex-1 bg-border" /> or sign in <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="director@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <FormError message={error} />

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-muted">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary hover:text-primary-hover font-medium transition-colors">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
