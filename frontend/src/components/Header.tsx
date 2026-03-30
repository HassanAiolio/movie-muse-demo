import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logout } from '@/hooks/use-auth';
import logo from '@/assets/logo.svg';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/home" className="flex items-center group">
            <img src={logo} alt="MovieMuse" className="h-10 w-auto" />
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-all duration-200"
          >
            <span className="text-sm font-medium">Sign Out</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}