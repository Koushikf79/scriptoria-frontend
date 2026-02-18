import { ReactNode } from 'react';
import { Film, BarChart3, Heart, DollarSign, Camera } from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Film className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-display font-bold text-gradient-gold">SCRIPTORIA</h1>
          </div>
          <p className="hidden md:block text-xs text-muted-foreground tracking-widest uppercase">
            AI Pre-Production Intelligence
          </p>
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
