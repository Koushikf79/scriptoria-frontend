import { useState } from 'react';
import { Film, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SAMPLE_SCREENPLAY } from '@/lib/mock-data';

interface HeroInputProps {
  onAnalyze: (script: string) => void;
  loading: boolean;
}

export default function HeroInput({ onAnalyze, loading }: HeroInputProps) {
  const [script, setScript] = useState('');

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center gap-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Film className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-gradient-gold leading-tight">
          SCRIPTORIA
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          AI-powered pre-production intelligence. Analyze screenplays, model emotions,
          simulate budgets, and generate cinematic storyboard visions.
        </p>
      </div>

      {/* Input */}
      <div className="w-full max-w-3xl space-y-4">
        <div className="glass-card p-1">
          <Textarea
            placeholder="Paste your screenplay here..."
            className="min-h-[200px] bg-transparent border-0 resize-y text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            value={script}
            onChange={e => setScript(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={() => onAnalyze(script)}
            disabled={!script.trim() || loading}
            className="gap-2 gold-glow"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Analyze Screenplay'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setScript(SAMPLE_SCREENPLAY)}
            disabled={loading}
          >
            Load Sample Script
          </Button>
        </div>
      </div>
    </div>
  );
}
