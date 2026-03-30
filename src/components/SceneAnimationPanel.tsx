import { useMemo, useState } from 'react';
import { SceneData } from '@/lib/types';
import { Play, RotateCcw, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SceneAnimationPanelProps {
  scenes: SceneData[];
}

const stageToneByTime: Record<string, string> = {
  NIGHT: 'bg-muted',
  SUNSET: 'bg-card',
  DAWN: 'bg-secondary',
  DAY: 'bg-secondary',
};

export default function SceneAnimationPanel({ scenes }: SceneAnimationPanelProps) {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scenes[0]?.scene_number?.toString() || '');
  const [replayKey, setReplayKey] = useState(0);

  const selectedScene = useMemo(
    () => scenes.find(scene => scene.scene_number.toString() === selectedSceneId) || scenes[0],
    [scenes, selectedSceneId]
  );

  if (!selectedScene) {
    return null;
  }

  const action = selectedScene.action_intensity;
  const emotion = selectedScene.emotional_intensity;
  const complexity = selectedScene.production_complexity;

  const pulseScale = 1 + emotion / 25;
  const shakeOffset = action / 3;
  const driftDuration = Math.max(3.5, 8 - action / 1.5);
  const orbCount = Math.max(3, Math.min(10, complexity));
  const stageTone = stageToneByTime[selectedScene.time_of_day.toUpperCase()] || 'bg-secondary';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold text-gradient-gold">Scene Animation Preview</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="gap-2" onClick={() => setReplayKey(v => v + 1)}>
            <RotateCcw className="h-4 w-4" />
            Replay
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedSceneId} onValueChange={setSelectedSceneId}>
          <SelectTrigger className="w-full sm:w-80 bg-secondary border-border">
            <SelectValue placeholder="Select a scene to animate..." />
          </SelectTrigger>
          <SelectContent>
            {scenes.map(scene => (
              <SelectItem key={scene.scene_number} value={scene.scene_number.toString()}>
                Scene {scene.scene_number}: {scene.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="gap-2" onClick={() => setReplayKey(v => v + 1)}>
          <Play className="h-4 w-4" />
          Play Animation
        </Button>
      </div>

      <div className="glass-card p-4 space-y-2">
        <p className="text-sm text-muted-foreground">{selectedScene.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <p><span className="text-foreground">Action:</span> {action}/10</p>
          <p><span className="text-foreground">Emotion:</span> {emotion}/10</p>
          <p><span className="text-foreground">Complexity:</span> {complexity}/10</p>
          <p><span className="text-foreground">Time:</span> {selectedScene.time_of_day}</p>
        </div>
      </div>

      <div
        key={`${selectedScene.scene_number}-${replayKey}`}
        className={`glass-card p-4 md:p-6 ${stageTone}`}
      >
        <div className="relative h-64 md:h-80 rounded-lg border border-border overflow-hidden bg-background/40">
          <div
            className="absolute inset-0 scene-wave"
            style={{
              animationDuration: `${driftDuration}s`,
              transform: `scale(${pulseScale})`,
            }}
          />

          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: `scene-shake ${Math.max(0.5, 1.6 - action / 10)}s ease-in-out infinite`,
            }}
          >
            <div
              className="h-16 w-16 rounded-full border border-primary/50 bg-primary/20 flex items-center justify-center"
              style={{
                transform: `translateX(${shakeOffset}px)`,
                animation: `scene-pulse ${Math.max(0.7, 2 - emotion / 8)}s ease-in-out infinite`,
              }}
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>

          {Array.from({ length: orbCount }).map((_, idx) => {
            const left = ((idx + 1) / (orbCount + 1)) * 100;
            const delay = idx * 0.15;
            const duration = driftDuration + (idx % 3) * 0.6;
            return (
              <div
                key={idx}
                className="absolute h-2.5 w-2.5 rounded-full bg-primary/60"
                style={{
                  left: `${left}%`,
                  bottom: '-10px',
                  animation: `scene-rise ${duration}s linear ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}