import { useState } from 'react';
import { EmotionData } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface EmotionGraphPanelProps {
  emotions: EmotionData[];
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#D4AF37',
  sadness: '#6B8DD6',
  anger: '#E05252',
  fear: '#9B6DD7',
  surprise: '#4ECDC4',
  tension: '#FF6B35',
  overall_intensity: '#D4AF37',
};

const EMOTION_KEYS = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'tension'] as const;

export default function EmotionGraphPanel({ emotions }: EmotionGraphPanelProps) {
  const [activeEmotions, setActiveEmotions] = useState<Set<string>>(new Set(['overall_intensity']));

  const toggleEmotion = (key: string) => {
    setActiveEmotions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const allKeys = ['overall_intensity', ...EMOTION_KEYS];

  // Summary
  const avgOverall = emotions.reduce((a, e) => a + e.overall_intensity, 0) / emotions.length;
  const peakScene = emotions.reduce((max, e) => e.overall_intensity > max.overall_intensity ? e : max, emotions[0]);
  const dominantEmotion = EMOTION_KEYS.reduce((best, key) => {
    const total = emotions.reduce((a, e) => a + e[key], 0);
    return total > best.total ? { key, total } : best;
  }, { key: '', total: 0 });

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-gradient-gold">Emotion Arc</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{avgOverall.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Intensity</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">Scene {peakScene.scene_number}</p>
          <p className="text-xs text-muted-foreground">Peak Emotion</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary capitalize">{dominantEmotion.key}</p>
          <p className="text-xs text-muted-foreground">Dominant Emotion</p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        {allKeys.map(key => (
          <button
            key={key}
            onClick={() => toggleEmotion(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              activeEmotions.has(key)
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: EMOTION_COLORS[key] }}
            />
            {key === 'overall_intensity' ? 'Overall' : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={emotions} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              {allKeys.map(key => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMOTION_COLORS[key]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={EMOTION_COLORS[key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis
              dataKey="scene_number"
              stroke="hsl(220 10% 55%)"
              tick={{ fontSize: 12 }}
              tickFormatter={v => `Scene ${v}`}
            />
            <YAxis domain={[0, 10]} stroke="hsl(220 10% 55%)" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220 18% 10%)',
                border: '1px solid hsl(220 15% 22%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={v => `Scene ${v}`}
            />
            {allKeys.filter(k => activeEmotions.has(k)).map(key => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={EMOTION_COLORS[key]}
                fill={`url(#grad-${key})`}
                strokeWidth={2}
                dot={{ r: 4, fill: EMOTION_COLORS[key] }}
                animationDuration={1200}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
