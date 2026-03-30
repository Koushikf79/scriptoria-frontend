import { useState } from 'react';
import { SceneData } from '@/lib/types';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SceneAnalysisPanelProps {
  scenes: SceneData[];
  onSelectScene: (scene: SceneData) => void;
}

function IntensityBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value <= 3 ? 'bg-intensity-low' : value <= 6 ? 'bg-intensity-mid' : 'bg-intensity-high';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`intensity-bar ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-4">{value}</span>
    </div>
  );
}

export default function SceneAnalysisPanel({ scenes, onSelectScene }: SceneAnalysisPanelProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = scenes.filter(s =>
    s.location.toLowerCase().includes(search.toLowerCase()) ||
    s.characters.some(c => c.toLowerCase().includes(search.toLowerCase())) ||
    s.time_of_day.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gradient-gold">Scene Analysis</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search location, character..."
            className="pl-9 bg-secondary border-border"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(scene => (
          <div key={scene.scene_number} className="glass-card overflow-hidden">
            <button
              className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
              onClick={() => setExpanded(expanded === scene.scene_number ? null : scene.scene_number)}
            >
              <span className="text-primary font-display font-bold text-lg w-8">
                {String(scene.scene_number).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{scene.location}</p>
                <p className="text-xs text-muted-foreground">{scene.time_of_day} · {scene.characters.join(', ')}</p>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Action</p>
                  <IntensityBar value={scene.action_intensity} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Emotion</p>
                  <IntensityBar value={scene.emotional_intensity} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Complexity</p>
                  <IntensityBar value={scene.production_complexity} />
                </div>
              </div>
              {expanded === scene.scene_number ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {expanded === scene.scene_number && (
              <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-3 animate-fade-in">
                <p className="text-sm text-muted-foreground">{scene.description}</p>
                <div className="flex md:hidden flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Action</span>
                    <IntensityBar value={scene.action_intensity} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Emotion</span>
                    <IntensityBar value={scene.emotional_intensity} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Complexity</span>
                    <IntensityBar value={scene.production_complexity} />
                  </div>
                </div>
                <button
                  onClick={() => onSelectScene(scene)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  → Explore Visually in Director Mode
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
