import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Loader2 } from 'lucide-react';
import { useSignup } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import logo from '@/assets/logo.svg';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: ''
  });
  const [bgImage, setBgImage] = useState('');
  const navigate = useNavigate();
  const signupMutation = useSignup();

  useEffect(() => {
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
    signupMutation.mutate(formData, {
      onSuccess: () => navigate('/first')
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex bg-background">
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
              Begin your <br/>
              <span className="text-primary italic">cinematic journey.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md font-light">
              Join a community of cinephiles and track the movies you love.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logo} alt="MovieMuse" className="h-10 w-auto" />
          </div>

          <h2 className="font-display text-3xl text-foreground mb-2">Create Account</h2>
          <p className="text-muted mb-8">Set up your profile to start exploring.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  required
                  value={formData.firstname}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Stanley"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  required
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Kubrick"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="director@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>

            {signupMutation.isError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                Failed to create account. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full py-3.5 bg-primary text-background font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {signupMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="mt-8 text-center text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
