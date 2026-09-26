import { Link, NavLink } from 'react-router-dom';
import { Bookmark, Compass, LogOut, User } from 'lucide-react';
import { logout } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';

const NAV_ITEMS = [
  { to: '/home', label: 'Discover', icon: Compass },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 gap-4">
          <Link to="/home" className="flex items-center shrink-0" aria-label="MovieMuse home">
            <img src={logo} alt="MovieMuse" className="h-8 sm:h-10 w-auto" />
          </Link>

          <nav className="flex items-center gap-1" aria-label="Main">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted hover:text-foreground hover:bg-white/5'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}

            <button
              onClick={logout}
              aria-label="Sign out"
              className="flex items-center gap-2 px-3 py-2 ml-1 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
