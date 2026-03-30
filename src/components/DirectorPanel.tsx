import { useState } from 'react';
import { SceneData, StoryboardVariation } from '@/lib/types';
import { MOCK_STORYBOARD } from '@/lib/mock-data';
import { generateStoryboard as generateStoryboardAPI } from '@/lib/analysis-socket';
import { Camera, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DirectorPanelProps {
  scenes: SceneData[];
  initialScene?: SceneData;
}

export default function DirectorPanel({ scenes, initialScene }: DirectorPanelProps) {
  const [selectedScene, setSelectedScene] = useState<SceneData | null>(initialScene || null);
  const [variations, setVariations] = useState<StoryboardVariation[] | null>(null);
  const [variationImages, setVariationImages] = useState<Record<number, string>>({});
  const [imageAttemptIndex, setImageAttemptIndex] = useState<Record<number, number>>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const buildFallbackSvg = (variation: StoryboardVariation) => {
    // Generate color scheme based on mood and lighting
    const moodColors: Record<string, { primary: string; secondary: string; bg: string }> = {
      tense: { primary: '#ef4444', secondary: '#dc2626', bg: '#1e1b1b' },
      dramatic: { primary: '#8b5cf6', secondary: '#7c3aed', bg: '#1a1625' },
      intimate: { primary: '#ec4899', secondary: '#db2777', bg: '#1f1822' },
      suspenseful: { primary: '#eab308', secondary: '#ca8a04', bg: '#1c1a14' },
      nostalgic: { primary: '#f59e0b', secondary: '#d97706', bg: '#1f1914' },
      melancholic: { primary: '#6366f1', secondary: '#4f46e5', bg: '#151720' },
      default: { primary: '#60a5fa', secondary: '#3b82f6', bg: '#0f172a' }
    };

    const getMoodKey = (mood: string): string => {
      const lower = mood.toLowerCase();
      for (const key of Object.keys(moodColors)) {
        if (lower.includes(key)) return key;
      }
      return 'default';
    };

    const colors = moodColors[getMoodKey(variation.mood)];
    
    // Determine frame composition based on angle
    const isCloseup = variation.angle.toLowerCase().includes('close') || variation.angle.toLowerCase().includes('macro');
    const isWide = variation.angle.toLowerCase().includes('wide') || variation.angle.toLowerCase().includes('establishing');
    const isLow = variation.angle.toLowerCase().includes('low');
    const isHigh = variation.angle.toLowerCase().includes('high') || variation.angle.toLowerCase().includes('overhead');
    
    // Visual elements based on camera angle
    let frameElement = '';
    if (isCloseup) {
      // Circle for close-up/macro shots
      frameElement = `<circle cx="384" cy="224" r="80" fill="none" stroke="${colors.primary}" stroke-width="4" opacity="0.6"/>
      <circle cx="384" cy="224" r="60" fill="none" stroke="${colors.secondary}" stroke-width="3" opacity="0.4"/>
      <circle cx="384" cy="224" r="40" fill="none" stroke="${colors.primary}" stroke-width="2" opacity="0.7"/>`;
    } else if (isWide) {
      // Wide rectangle for establishing/wide shots
      frameElement = `<rect x="100" y="150" width="568" height="180" rx="8" fill="none" stroke="${colors.primary}" stroke-width="4" opacity="0.6"/>
      <rect x="120" y="170" width="528" height="140" rx="6" fill="none" stroke="${colors.secondary}" stroke-width="2" opacity="0.4"/>
      <line x1="384" y1="150" x2="384" y2="330" stroke="${colors.primary}" stroke-width="1" opacity="0.3"/>`;
    } else {
      // Standard frame
      frameElement = `<rect x="250" y="130" width="268" height="180" rx="8" fill="none" stroke="${colors.primary}" stroke-width="4" opacity="0.6"/>
      <rect x="270" y="150" width="228" height="140" rx="6" fill="none" stroke="${colors.secondary}" stroke-width="2" opacity="0.4"/>`;
    }
    
    // Lighting indicators
    let lightingViz = '';
    if (variation.lighting.toLowerCase().includes('overhead') || isHigh) {
      lightingViz = `<line x1="384" y1="60" x2="384" y2="120" stroke="${colors.primary}" stroke-width="3" opacity="0.5"/>
      <circle cx="384" cy="60" r="15" fill="${colors.primary}" opacity="0.4"/>`;
    } else if (variation.lighting.toLowerCase().includes('side') || variation.lighting.toLowerCase().includes('rim')) {
      lightingViz = `<line x1="650" y1="224" x2="550" y2="224" stroke="${colors.primary}" stroke-width="3" opacity="0.5"/>
      <circle cx="650" cy="224" r="15" fill="${colors.primary}" opacity="0.4"/>`;
    } else if (isLow || variation.lighting.toLowerCase().includes('under')) {
      lightingViz = `<line x1="384" y1="388" x2="384" y2="328" stroke="${colors.primary}" stroke-width="3" opacity="0.5"/>
      <circle cx="384" cy="388" r="15" fill="${colors.primary}" opacity="0.4"/>`;
    } else {
      lightingViz = `<circle cx="100" cy="100" r="20" fill="${colors.primary}" opacity="0.3"/>
      <line x1="120" y1="100" x2="300" y2="200" stroke="${colors.primary}" stroke-width="2" opacity="0.3"/>`;
    }

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="448" viewBox="0 0 768 448">
  <defs>
    <linearGradient id="bg-${variation.angle}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${colors.bg}"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <pattern id="grid-${variation.angle}" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${colors.primary}" stroke-width="0.5" opacity="0.2"/>
    </pattern>
    <filter id="glow-${variation.angle}">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="768" height="448" fill="url(#bg-${variation.angle})"/>
  <rect width="768" height="448" fill="url(#grid-${variation.angle})"/>
  <g filter="url(#glow-${variation.angle})">
    ${frameElement}
    ${lightingViz}
  </g>
  <text x="384" y="345" fill="#e2e8f0" font-size="26" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle">${variation.angle.substring(0, 35)}</text>
  <text x="384" y="375" fill="#94a3b8" font-size="15" font-family="Arial, sans-serif" text-anchor="middle">${variation.lens.substring(0, 45)}</text>
  <rect x="200" y="390" width="368" height="30" rx="15" fill="${colors.primary}" opacity="0.15"/>
  <text x="384" y="410" fill="${colors.primary}" font-size="13" font-family="Arial, sans-serif" text-anchor="middle" font-weight="600">${variation.mood.substring(0, 30).toUpperCase()}</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const buildClientImageUrl = (variation: StoryboardVariation, index: number, attempt: number): string => {
    // Always use SVG visualization for reliability
    // External APIs (pollinations.ai) are often unreliable due to rate limits, CORS, or downtime
    return buildFallbackSvg(variation);
  };

  const generateVariationImages = async (sourceVariations: StoryboardVariation[]) => {
    if (!selectedScene || sourceVariations.length === 0) return;
    setImageLoading(true);
    
    // Generate SVG visualizations directly (no external API dependency)
    const mapped: Record<number, string> = {};
    sourceVariations.forEach((variation, idx) => {
      mapped[idx] = buildFallbackSvg(variation);
    });
    
    setVariationImages(mapped);
    setImageAttemptIndex({});
    setImageLoading(false);
  };

  const generateStoryboard = async () => {
    if (!selectedScene) return;
    setVariationImages({});
    setImageAttemptIndex({});
    setLoading(true);
    try {
      const response = await generateStoryboardAPI(
        selectedScene.scene_number,
        selectedScene.description,
        selectedScene.location,
        selectedScene.time_of_day,
        'NEUTRAL', // You may want to extract this from emotion data
        selectedScene.action_intensity
      );

      if (response?.variations && response.variations.length > 0) {
        // Convert ShotVariation to StoryboardVariation format
        const variations: StoryboardVariation[] = response.variations.map((shot: any) => ({
          angle: shot.cameraMovement || 'Standard',
          prompt: shot.detailedPrompt,
          camera: shot.shotType,
          lens: shot.lens,
          lighting: shot.lightingStyle,
          mood: shot.mood,
          composition: shot.composition,
        }));
        setVariations(variations);
        generateVariationImages(variations);
      } else {
        // Fallback to mock
        setVariations(MOCK_STORYBOARD);
        generateVariationImages(MOCK_STORYBOARD);
      }
    } catch (err: any) {
      console.error('Storyboard generation error:', err);
      toast({ title: 'Using preview data', description: 'AI storyboard unavailable, showing sample prompts.', variant: 'destructive' });
      setVariations(MOCK_STORYBOARD);
      generateVariationImages(MOCK_STORYBOARD);
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
              <div className="rounded-md overflow-hidden border border-border bg-secondary/20 aspect-video">
                {imageLoading ? (
                  <div className="h-full w-full cinematic-loading" />
                ) : !variationImages[i] ? (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
                    Preview unavailable for this variation.
                  </div>
                ) : (
                  <img
                    src={variationImages[i]}
                    alt={`${v.angle} storyboard preview`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>

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
