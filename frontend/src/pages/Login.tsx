import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import logo from '@/assets/logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bgImage, setBgImage] = useState('');
  const navigate = useNavigate();
  const loginMutation = useLogin();

  useEffect(() => {
    // Fetch random movie for background
    api.get('/movies/').then(({ data }) => {
      if (data && data.length > 0) {
        const withImages = data.filter((m: any) => m.image);
        if (withImages.length > 0) {
          const random = withImages[Math.floor(Math.random() * withImages.length)];
          setBgImage(random.image);
        }
      }
    }).catch(() => {
      setBgImage(`https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop&q=80`);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password }, {
      onSuccess: () => navigate('/home')
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Half - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
        {bgImage && (
          <img 
            src={bgImage} 
            alt="Cinema Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="relative z-20 flex flex-col justify-center items-center px-16 h-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={logo} alt="MovieMuse" className="h-24 w-auto" />
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight">
              Your personal <br/>
              <span className="text-primary italic">film archive.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md font-light">
              Discover, rate, and curate the cinema that moves you.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Half - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        {/* Subtle decorative gradients */}
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

          <h2 className="font-display text-3xl text-foreground mb-2">Welcome back</h2>
          <p className="text-muted mb-8">Enter your details to access your archive.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="director@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            {loginMutation.isError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                Invalid email or password. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
