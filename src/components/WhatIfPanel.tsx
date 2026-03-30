import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { SceneData, WhatIfAdjustments, WhatIfSimulationResult } from '@/lib/types';
import { postJson } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WhatIfPanelProps {
  scenes: SceneData[];
  originalEmotionCurve: Array<{ scene_number: number; overall_intensity: number }>;
}

export default function WhatIfPanel({ scenes, originalEmotionCurve }: WhatIfPanelProps) {
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [adjustments, setAdjustments] = useState<Partial<WhatIfAdjustments>>({});
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runSimulation = async () => {
    if (!selectedScene) return;
    setLoading(true);
    try {
      const response = await postJson<any>('/api/analyze/what-if', {
        scene_number: selectedScene,
        adjustments,
      });
      const payload = response?.data ?? response;
      if (payload?.result) {
        setSimulationResult(payload.result);
      } else {
        throw new Error('No simulation result');
      }
    } catch (err: any) {
      console.error('What-if simulation error:', err);
      if (err?.message?.includes('429') || err?.status === 429) {
        toast({ title: 'Rate limited', description: 'Too many requests. Please wait a moment.', variant: 'destructive' });
      } else if (err?.message?.includes('402') || err?.status === 402) {
        toast({ title: 'Credits required', description: 'Please add credits to continue using AI features.', variant: 'destructive' });
      } else {
        toast({ title: 'Simulation failed', description: 'Unable to run what-if analysis. Try again.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const getDeltaColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-muted-foreground';
  };

  // Merge original and adjusted emotion curves for comparison
  const comparisonData = simulationResult
    ? originalEmotionCurve.map((orig) => {
        const adjusted = simulationResult.adjusted_emotion_curve.find(
          (a) => a.scene_number === orig.scene_number
        );
        return {
          scene_number: orig.scene_number,
          original: orig.overall_intensity,
          adjusted: adjusted?.overall_intensity || orig.overall_intensity,
        };
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-gradient-gold">What-If Simulation Engine</h2>

      {/* Controls */}
      <div className="glass-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Target Scene</Label>
            <Select
              value={selectedScene?.toString() || ''}
              onValueChange={(v) => setSelectedScene(Number(v))}
            >
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue placeholder="Select scene to modify..." />
              </SelectTrigger>
              <SelectContent>
                {scenes.map((s) => (
                  <SelectItem key={s.scene_number} value={s.scene_number.toString()}>
                    Scene {s.scene_number}: {s.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Action Intensity Shift</Label>
            <Input
              type="text"
              placeholder="e.g., +intense chase, -dialogue"
              className="bg-secondary border-border mt-1"
              onChange={(e) =>
                setAdjustments((prev) => ({ ...prev, action_modification: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Emotion Target</Label>
            <Select
              value={adjustments.emotion_target || ''}
              onValueChange={(v) =>
                setAdjustments((prev) => ({ ...prev, emotion_target: v }))
              }
            >
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue placeholder="Shift emotion..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="joy">Joy</SelectItem>
                <SelectItem value="sadness">Sadness</SelectItem>
                <SelectItem value="anger">Anger</SelectItem>
                <SelectItem value="fear">Fear</SelectItem>
                <SelectItem value="surprise">Surprise</SelectItem>
                <SelectItem value="tension">Tension</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Star Tier Adjustment</Label>
            <Select
              value={adjustments.star_tier_adjustment || ''}
              onValueChange={(v) =>
                setAdjustments((prev) => ({ ...prev, star_tier_adjustment: v }))
              }
            >
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue placeholder="Cast change..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A to B">A-List → B-List</SelectItem>
                <SelectItem value="B to A">B-List → A-List</SelectItem>
                <SelectItem value="B to C">B-List → C-List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Market Reposition</Label>
            <Input
              type="text"
              placeholder="e.g., domestic to international"
              className="bg-secondary border-border mt-1"
              onChange={(e) =>
                setAdjustments((prev) => ({ ...prev, market_reposition: e.target.value }))
              }
            />
          </div>
        </div>

        <Button onClick={runSimulation} disabled={!selectedScene || loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          Run Simulation
        </Button>
      </div>

      {/* Results */}
      {simulationResult && (
        <>
          {/* Delta Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-card p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">Narrative Strength</p>
              <p className={`text-3xl font-bold ${getDeltaColor(simulationResult.narrative_strength_delta)}`}>
                {formatDelta(simulationResult.narrative_strength_delta)}
              </p>
              {simulationResult.narrative_strength_delta >= 0 ? (
                <TrendingUp className="h-5 w-5 mx-auto mt-2 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 mx-auto mt-2 text-red-400" />
              )}
            </div>

            <div className="glass-card p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">Domestic Appeal</p>
              <p
                className={`text-3xl font-bold ${getDeltaColor(
                  simulationResult.market_viability_shift.domestic_change
                )}`}
              >
                {formatDelta(simulationResult.market_viability_shift.domestic_change)}%
              </p>
            </div>

            <div className="glass-card p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">International Appeal</p>
              <p
                className={`text-3xl font-bold ${getDeltaColor(
                  simulationResult.market_viability_shift.international_change
                )}`}
              >
                {formatDelta(simulationResult.market_viability_shift.international_change)}%
              </p>
            </div>
          </div>

          {/* Budget Comparison */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-primary mb-4">Budget Impact</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Budget Shift</p>
                <p className={`text-2xl font-bold ${getDeltaColor(simulationResult.adjusted_budget_projection.total_budget_change_usd)}`}>
                  ${simulationResult.adjusted_budget_projection.total_budget_change_usd.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Key Driver</p>
                <p className="text-sm text-foreground/80">{simulationResult.adjusted_budget_projection.primary_cost_driver}</p>
              </div>
            </div>
          </div>

          {/* Emotion Curve Comparison Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Emotion Arc Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={comparisonData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-original" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B8DD6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6B8DD6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-adjusted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                <XAxis
                  dataKey="scene_number"
                  stroke="hsl(220 10% 55%)"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `Scene ${v}`}
                />
                <YAxis domain={[0, 10]} stroke="hsl(220 10% 55%)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220 18% 10%)',
                    border: '1px solid hsl(220 15% 22%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(v) => `Scene ${v}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="original"
                  stroke="#6B8DD6"
                  fill="url(#grad-original)"
                  strokeWidth={2}
                  name="Original"
                />
                <Area
                  type="monotone"
                  dataKey="adjusted"
                  stroke="#10B981"
                  fill="url(#grad-adjusted)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Adjusted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
