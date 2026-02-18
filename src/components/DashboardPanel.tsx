import { Film, Users, Zap, MapPin, Moon, TrendingUp } from 'lucide-react';
import { AnalysisResult } from '@/lib/types';

interface DashboardPanelProps {
  analysis: AnalysisResult;
  onNavigate: (tab: string) => void;
}

const formatNumber = (n: number) => n.toFixed(1);

export default function DashboardPanel({ analysis, onNavigate }: DashboardPanelProps) {
  const { summary } = analysis;

  const metrics = [
    { label: 'Total Scenes', value: summary.total_scenes, icon: Film, color: 'text-primary' },
    { label: 'Characters', value: summary.total_characters, icon: Users, color: 'text-primary' },
    { label: 'Avg Action', value: formatNumber(summary.avg_action_intensity), icon: Zap, color: 'text-intensity-high' },
    { label: 'Avg Emotion', value: formatNumber(summary.avg_emotional_intensity), icon: TrendingUp, color: 'text-intensity-mid' },
    { label: 'Locations', value: summary.unique_locations, icon: MapPin, color: 'text-intensity-low' },
    { label: 'Night Scenes', value: summary.night_scenes, icon: Moon, color: 'text-muted-foreground' },
  ];

  const panels = [
    { id: 'scenes', title: 'Scene Analysis', desc: 'Detailed breakdown of every scene with intensity metrics' },
    { id: 'emotions', title: 'Emotion Arc', desc: 'Emotional journey visualization across the screenplay' },
    { id: 'budget', title: 'Budget Simulation', desc: 'AI-estimated production costs across budget tiers' },
    { id: 'director', title: 'Director Mode', desc: 'Generate cinematic storyboard prompts for any scene' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-display font-bold text-gradient-gold mb-2">Analysis Complete</h2>
        <p className="text-muted-foreground">Your screenplay has been analyzed. Explore the results below.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold font-display">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Nav */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {panels.map(({ id, title, desc }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="glass-card p-6 text-left hover:border-primary/50 transition-all group"
          >
            <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
