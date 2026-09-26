import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSignup } from '@/hooks/use-auth';
import { AuthLayout, FormError, inputClass } from '@/components/AuthLayout';
import { errorMessage } from '@/lib/api';
import { hasValidSession } from '@/lib/session';

const MIN_PASSWORD_LENGTH = 8;

export default function Signup() {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const navigate = useNavigate();
  // Checked once on mount: re-checking after sign-in would race the navigate() below.
  const [alreadySignedIn] = useState(hasValidSession);
  const signupMutation = useSignup();

  if (alreadySignedIn) return <Navigate to="/home" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(formData, { onSuccess: () => navigate('/first', { replace: true }) });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AuthLayout
      headline={<>Begin your <br /><span className="text-primary italic">cinematic journey.</span></>}
      tagline="Pick a few films you love and get recommendations in seconds."
    >
      <h2 className="font-display text-3xl text-foreground mb-2">Create account</h2>
      <p className="text-muted mb-8">Set up your profile to start exploring.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstname" className="text-sm font-medium text-foreground">First name</label>
            <input id="firstname" type="text" name="firstname" autoComplete="given-name" required maxLength={50} value={formData.firstname} onChange={handleChange} className={inputClass} placeholder="Stanley" />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastname" className="text-sm font-medium text-foreground">Last name</label>
            <input id="lastname" type="text" name="lastname" autoComplete="family-name" required maxLength={50} value={formData.lastname} onChange={handleChange} className={inputClass} placeholder="Kubrick" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input id="email" type="email" name="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="director@example.com" />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="••••••••"
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <FormError message={signupMutation.isError ? errorMessage(signupMutation.error, 'Failed to create account. Please try again.') : null} />

        <button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full py-3.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {signupMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-8 text-center text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
