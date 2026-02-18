import { useState } from 'react';
import { SceneData, StoryboardVariation } from '@/lib/types';
import { MOCK_STORYBOARD } from '@/lib/mock-data';
import { Camera, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DirectorPanelProps {
  scenes: SceneData[];
  initialScene?: SceneData;
}

export default function DirectorPanel({ scenes, initialScene }: DirectorPanelProps) {
  const [selectedScene, setSelectedScene] = useState<SceneData | null>(initialScene || null);
  const [variations, setVariations] = useState<StoryboardVariation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateStoryboard = async () => {
    if (!selectedScene) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('storyboard-generator', {
        body: { scene: selectedScene },
      });
      if (error) throw error;
      if (data?.variations) {
        setVariations(data.variations);
      } else {
        // Fallback to mock
        setVariations(MOCK_STORYBOARD);
      }
    } catch (err: any) {
      console.error('Storyboard generation error:', err);
      if (err?.message?.includes('429') || err?.status === 429) {
        toast({ title: 'Rate limited', description: 'Too many requests. Please wait a moment.', variant: 'destructive' });
      } else if (err?.message?.includes('402') || err?.status === 402) {
        toast({ title: 'Credits required', description: 'Please add credits to continue using AI features.', variant: 'destructive' });
      } else {
        toast({ title: 'Using preview data', description: 'AI storyboard unavailable, showing sample prompts.' });
      }
      setVariations(MOCK_STORYBOARD);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-gradient-gold">Director Mode</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={selectedScene?.scene_number?.toString() || ''}
          onValueChange={v => setSelectedScene(scenes.find(s => s.scene_number === Number(v)) || null)}
        >
          <SelectTrigger className="w-full sm:w-80 bg-secondary border-border">
            <SelectValue placeholder="Select a scene to visualize..." />
          </SelectTrigger>
          <SelectContent>
            {scenes.map(s => (
              <SelectItem key={s.scene_number} value={s.scene_number.toString()}>
                Scene {s.scene_number}: {s.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={generateStoryboard}
          disabled={!selectedScene || loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Explore Visually
        </Button>
      </div>

      {selectedScene && (
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">{selectedScene.description}</p>
        </div>
      )}

      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="storyboard-frame p-6 h-64 cinematic-loading" />
          ))}
        </div>
      )}

      {!loading && variations && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variations.map((v, i) => (
            <div key={i} className="storyboard-frame p-5 space-y-3" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-primary">{v.angle}</h3>
                <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                  {v.lens}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{v.prompt}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Camera:</span>
                  <p className="text-foreground/70">{v.camera}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lighting:</span>
                  <p className="text-foreground/70">{v.lighting}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mood:</span>
                  <p className="text-foreground/70">{v.mood}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Composition:</span>
                  <p className="text-foreground/70">{v.composition}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
