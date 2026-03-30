import { ReactNode } from 'react';
import { Film, BarChart3, Heart, DollarSign, Camera } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

interface ScriptoriaLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasAnalysis: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Film },
  { id: 'scenes', label: 'Scene Analysis', icon: BarChart3 },
  { id: 'emotions', label: 'Emotion Arc', icon: Heart },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'director', label: 'Director Mode', icon: Camera },
];

export default function ScriptoriaLayout({ children, activeTab, onTabChange, hasAnalysis }: ScriptoriaLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Film className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-display font-bold text-gradient-gold">SCRIPTORIA</h1>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs md:text-sm rounded-md border border-primary/40 px-3 py-1.5 text-primary hover:bg-primary/10 transition-all"
              >
                History
              </button>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/30 px-2 py-1">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold grid place-items-center">
                  {user?.fullName?.slice(0, 1).toUpperCase() || 'U'}
                </span>
                <span className="text-xs text-muted-foreground max-w-28 truncate">{user?.fullName || 'User'}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="text-xs md:text-sm rounded-md border border-primary/40 px-3 py-1.5 text-primary hover:bg-primary/10 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="hidden md:block text-xs text-muted-foreground tracking-widest uppercase mr-2">
                AI Pre-Production Intelligence
              </p>
              <button
                onClick={() => navigate('/login')}
                className="text-xs md:text-sm rounded-md border border-primary/40 px-3 py-1.5 text-primary hover:bg-primary/10 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="text-xs md:text-sm rounded-md bg-primary/20 border border-primary/40 px-3 py-1.5 text-primary hover:bg-primary/30 transition-all"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      {hasAnalysis && (
        <nav className="border-b border-border/30 bg-background/60 backdrop-blur-sm sticky top-16 z-40">
          <div className="container flex gap-1 py-2 overflow-x-auto">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-primary/15 text-primary gold-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}
