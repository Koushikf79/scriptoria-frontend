import { useEffect, useMemo, useState } from 'react';
import { AIBudgetEstimate, BudgetOptimizationInsight, BudgetProjectionByMarket, BudgetSimulation, Market, MARKET_CONFIG, SceneData } from '@/lib/types';
import { simulateBudget } from '@/lib/budget-engine';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { postJson } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface BudgetPanelProps {
  scenes: SceneData[];
  initialBudget: BudgetSimulation;
}

const STAR_TIER_MULTIPLIER: Record<string, number> = {
  none: 0.06,
  A: 1.25,
  B: 1,
  C: 0.85,
};

function normalizeMarket(value: string | undefined | null): Market {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'telugu' || normalized === 'tollywood') return 'telugu';
  if (normalized === 'bollywood') return 'bollywood';
  if (normalized === 'hollywood') return 'hollywood';
  if (normalized === 'korean') return 'korean';
  return 'general';
}

function formatCurrency(value: number, currency: string, symbol: string): string {
  if (currency === 'INR') {
    if (value >= 10_000_000) return `${symbol}${(value / 10_000_000).toFixed(1)}Cr`;
    if (value >= 100_000) return `${symbol}${(value / 100_000).toFixed(1)}L`;
    if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
    return `${symbol}${Math.round(value)}`;
  }

  if (value >= 1_000_000_000) return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${Math.round(value)}`;
}

export default function BudgetPanel({ scenes, initialBudget }: BudgetPanelProps) {
  const normalizedInitialMarket = normalizeMarket(initialBudget.market);
  const [market, setMarket] = useState<Market>(normalizedInitialMarket);
  const [starTier, setStarTier] = useState('B');
  const [optimization, setOptimization] = useState<BudgetOptimizationInsight | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [hasTriedOptimization, setHasTriedOptimization] = useState(false);
  const [aiEstimatedBudget, setAiEstimatedBudget] = useState<BudgetSimulation | null>(null);
  const [aiBudgetLoading, setAiBudgetLoading] = useState(false);
  const [hasTriedAIBudget, setHasTriedAIBudget] = useState(false);
  const config = MARKET_CONFIG[market] ?? MARKET_CONFIG.general;
  const { toast } = useToast();

  const applyStarTierToBudget = (source: BudgetSimulation, tier: string): BudgetSimulation => {
    const multiplier = STAR_TIER_MULTIPLIER[tier] ?? 1;
    return {
      ...source,
      total_low: Math.round(source.total_low * multiplier),
      total_mid: Math.round(source.total_mid * multiplier),
      total_high: Math.round(source.total_high * multiplier),
      breakdown: source.breakdown.map((item) => ({
        ...item,
        low: Math.round(item.low * multiplier),
        mid: Math.round(item.mid * multiplier),
        high: Math.round(item.high * multiplier),
      })),
    };
  };

  const baseBudget = market === normalizedInitialMarket
    ? {
        ...initialBudget,
        market: normalizedInitialMarket,
      }
    : simulateBudget(scenes, market);
  const budget = useMemo(() => applyStarTierToBudget(baseBudget, starTier), [baseBudget, starTier]);
  const displayBudget = aiEstimatedBudget ?? budget;

  const deterministicProjection: BudgetProjectionByMarket = useMemo(
    () => ({
      telugu: Math.round(simulateBudget(scenes, 'telugu').total_mid * (STAR_TIER_MULTIPLIER[starTier] ?? 1)),
      bollywood: Math.round(simulateBudget(scenes, 'bollywood').total_mid * (STAR_TIER_MULTIPLIER[starTier] ?? 1)),
      hollywood: Math.round(simulateBudget(scenes, 'hollywood').total_mid * (STAR_TIER_MULTIPLIER[starTier] ?? 1)),
      korean: Math.round(simulateBudget(scenes, 'korean').total_mid * (STAR_TIER_MULTIPLIER[starTier] ?? 1)),
      general: Math.round(simulateBudget(scenes, 'general').total_mid * (STAR_TIER_MULTIPLIER[starTier] ?? 1)),
    }),
    [scenes, starTier],
  );

  const buildFallbackOptimization = (): BudgetOptimizationInsight => {
    const nightScenes = scenes.filter((s) => s.time_of_day.toUpperCase().includes('NIGHT')).length;
    const avgAction = scenes.length ? scenes.reduce((a, s) => a + s.action_intensity, 0) / scenes.length : 0;
    const avgComplexity = scenes.length ? scenes.reduce((a, s) => a + s.production_complexity, 0) / scenes.length : 0;
    const uniqueLocations = new Set(scenes.map((s) => s.location)).size;
    const savingsPct = starTier === 'A' ? 9 : starTier === 'B' ? 11 : starTier === 'C' ? 13 : 15;
    const ratio = 1 - savingsPct / 100;

    return {
      primary_cost_drivers: [
        {
          category: 'Action & Stunt Density',
          impact_level: Math.min(10, Math.max(4, Number(avgAction.toFixed(1)))),
          reason: 'Higher stunt prep, action rehearsals, safety crews, and reset cycles increase shoot-day costs.',
        },
        {
          category: 'Production Complexity',
          impact_level: Math.min(10, Math.max(4, Number(avgComplexity.toFixed(1)))),
          reason: 'Complex scenes typically require additional departments, technical supervision, and longer setup windows.',
        },
        {
          category: 'Location Logistics',
          impact_level: Math.min(10, Math.max(3, uniqueLocations)),
          reason: 'Frequent location moves drive transport, permits, accommodation, and schedule inefficiency.',
        },
      ],
      hidden_cost_drivers: [
        nightScenes > 0 ? 'Night-shoot overtime, power distribution, and lighting escalation' : 'Second-unit standby and buffer-day costs',
        'Departmental idle time during location transitions',
        'Incremental post-production spillover from shot-volume growth',
      ],
      optimization_strategies: [
        {
          strategy: 'Block-shoot by geography and light condition',
          implementation_notes: 'Cluster scenes by location/night-day blocks to reduce setup churn and transport overhead.',
          expected_savings_percentage: 4.5,
        },
        {
          strategy: 'Previsualize high-cost scenes before principal photography',
          implementation_notes: 'Use techviz for stunt/VFX-heavy moments to lower on-set trial iterations.',
          expected_savings_percentage: 3.5,
        },
        {
          strategy: 'Prioritize key spectacle beats over redundant coverage',
          implementation_notes: 'Preserve cinematic scale while reducing non-essential setups and overtime risk.',
          expected_savings_percentage: 3,
        },
      ],
      optimized_budget_projection: {
        telugu: Math.round(deterministicProjection.telugu * ratio),
        bollywood: Math.round(deterministicProjection.bollywood * ratio),
        hollywood: Math.round(deterministicProjection.hollywood * ratio),
        korean: Math.round(deterministicProjection.korean * ratio),
        general: Math.round(deterministicProjection.general * ratio),
      },
      total_savings_percentage: savingsPct,
      quality_tradeoff_assessment:
        'Minimal cinematic impact when optimization focuses on scheduling efficiency and previsualization rather than reducing major story beats.',
    };
  };

  const normalizeOptimizationPayload = (data: any): BudgetOptimizationInsight => {
    const fallbackBySavings = (savingsPct: number) => {
      const ratio = Math.max(0, 1 - savingsPct / 100);
      return {
        telugu: Math.round(deterministicProjection.telugu * ratio),
        bollywood: Math.round(deterministicProjection.bollywood * ratio),
        hollywood: Math.round(deterministicProjection.hollywood * ratio),
        korean: Math.round(deterministicProjection.korean * ratio),
        general: Math.round(deterministicProjection.general * ratio),
      };
    };

    const savings = Number(data?.total_savings_percentage ?? 0);
    const safeSavings = Number.isFinite(savings) ? Math.max(0, savings) : 0;
    return {
      primary_cost_drivers: Array.isArray(data?.primary_cost_drivers) ? data.primary_cost_drivers : [],
      hidden_cost_drivers: Array.isArray(data?.hidden_cost_drivers) ? data.hidden_cost_drivers : [],
      optimization_strategies: Array.isArray(data?.optimization_strategies) ? data.optimization_strategies : [],
      optimized_budget_projection: data?.optimized_budget_projection
        ? {
            telugu: Number(data.optimized_budget_projection.telugu ?? deterministicProjection.telugu),
            bollywood: Number(data.optimized_budget_projection.bollywood ?? deterministicProjection.bollywood),
            hollywood: Number(data.optimized_budget_projection.hollywood ?? deterministicProjection.hollywood),
            korean: Number(data.optimized_budget_projection.korean ?? deterministicProjection.korean),
            general: Number(data.optimized_budget_projection.general ?? deterministicProjection.general),
          }
        : fallbackBySavings(safeSavings),
      total_savings_percentage: safeSavings,
      quality_tradeoff_assessment: typeof data?.quality_tradeoff_assessment === 'string' ? data.quality_tradeoff_assessment : '',
    };
  };

  useEffect(() => {
    setAiEstimatedBudget(null);
    setHasTriedAIBudget(false);
    setOptimization(null);
    setHasTriedOptimization(false);
  }, [market, starTier, scenes]);

  useEffect(() => {
    estimateBudgetWithAI();
    evaluateOptimization();
  }, [market, starTier, scenes]);

  const normalizeAIBudget = (data: any): AIBudgetEstimate => {
    const breakdown = Array.isArray(data?.breakdown) ? data.breakdown : [];
    return {
      total_low: Number(data?.total_low ?? 0),
      total_mid: Number(data?.total_mid ?? 0),
      total_high: Number(data?.total_high ?? 0),
      breakdown: breakdown
        .filter((b: any) => b && typeof b.category === 'string')
        .map((b: any) => ({
          category: b.category,
          low: Number(b.low ?? 0),
          mid: Number(b.mid ?? 0),
          high: Number(b.high ?? 0),
        })),
      cost_drivers: Array.isArray(data?.cost_drivers) ? data.cost_drivers : [],
      confidence_score: Number.isFinite(Number(data?.confidence_score)) ? Number(data.confidence_score) : undefined,
    };
  };

  const estimateBudgetWithAI = async () => {
    setHasTriedAIBudget(true);
    setAiBudgetLoading(true);
    try {
      const response = await postJson<any>('/api/analyze/budget', {
        scene_breakdown: scenes,
        star_tier: starTier,
        target_market: market,
        deterministic_budget: {
          total_low: budget.total_low,
          total_mid: budget.total_mid,
          total_high: budget.total_high,
          breakdown: budget.breakdown,
          cost_drivers: budget.cost_drivers,
        },
      });
      const payload = response?.data ?? response;

      const normalized = normalizeAIBudget(payload);
      const hasValidTotals = normalized.total_low > 0 && normalized.total_mid > 0 && normalized.total_high > 0;

      if (!hasValidTotals) {
        setAiEstimatedBudget(null);
        toast({ title: 'AI estimate unavailable', description: 'Using deterministic budget for this market/tier.', variant: 'destructive' });
        return;
      }

      setAiEstimatedBudget({
        market,
        currency: config.currency,
        total_low: Math.round(normalized.total_low),
        total_mid: Math.round(normalized.total_mid),
        total_high: Math.round(normalized.total_high),
        breakdown: normalized.breakdown.length > 0 ? normalized.breakdown : budget.breakdown,
        cost_drivers: normalized.cost_drivers.length > 0 ? normalized.cost_drivers : budget.cost_drivers,
      });
    } catch (err: any) {
      console.error('AI budget estimation error:', err);
      setAiEstimatedBudget(null);
      if (err?.message?.includes('429') || err?.status === 429) {
        toast({ title: 'Rate limited', description: 'AI estimate unavailable. Using deterministic budget.', variant: 'destructive' });
      } else if (err?.message?.includes('402') || err?.status === 402) {
        toast({ title: 'Credits required', description: 'AI estimate unavailable. Using deterministic budget.', variant: 'destructive' });
      } else {
        toast({ title: 'AI estimate failed', description: 'Using deterministic budget as fallback.', variant: 'destructive' });
      }
    } finally {
      setAiBudgetLoading(false);
    }
  };

  const evaluateOptimization = async () => {
    setHasTriedOptimization(true);
    setOptimizationLoading(true);
    try {
      const response = await postJson<any>('/api/analyze/risk', {
        scene_breakdown: scenes,
        budget_projection: deterministicProjection,
        star_tier: starTier,
        target_market: market,
      });

      const payload = response?.data ?? response;
      const normalized = normalizeOptimizationPayload(payload);
      const hasUsableContent = normalized.primary_cost_drivers.length > 0 || normalized.optimization_strategies.length > 0;
      setOptimization(hasUsableContent ? normalized : buildFallbackOptimization());
    } catch (err: any) {
      console.error('Budget optimization error:', err);
      setOptimization(buildFallbackOptimization());
      if (err?.message?.includes('429') || err?.status === 429) {
        toast({ title: 'Rate limited', description: 'Using deterministic fallback insights.', variant: 'destructive' });
      } else if (err?.message?.includes('402') || err?.status === 402) {
        toast({ title: 'Credits required', description: 'Using deterministic fallback insights.', variant: 'destructive' });
      } else {
        toast({ title: 'Optimization fallback active', description: 'AI insights unavailable, showing deterministic optimization.', variant: 'destructive' });
      }
    } finally {
      setOptimizationLoading(false);
    }
  };

  const tiers = [
    { label: 'Low Budget', total: displayBudget.total_low, color: 'text-intensity-low', bg: 'bg-intensity-low/10 border-intensity-low/30' },
    { label: 'Mid Budget', total: displayBudget.total_mid, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
    { label: 'High Budget', total: displayBudget.total_high, color: 'text-intensity-high', bg: 'bg-intensity-high/10 border-intensity-high/30' },
  ];

  const chartData = displayBudget.breakdown.map(b => ({
    category: b.category.split(' ')[0],
    Low: b.low,
    Mid: b.mid,
    High: b.high,
  }));

  const optimizationChartData = [
    { market: 'Telugu', original: deterministicProjection.telugu, optimized: optimization?.optimized_budget_projection.telugu ?? 0 },
    { market: 'Bollywood', original: deterministicProjection.bollywood, optimized: optimization?.optimized_budget_projection.bollywood ?? 0 },
    { market: 'Hollywood', original: deterministicProjection.hollywood, optimized: optimization?.optimized_budget_projection.hollywood ?? 0 },
    { market: 'Korean', original: deterministicProjection.korean, optimized: optimization?.optimized_budget_projection.korean ?? 0 },
    { market: 'General', original: deterministicProjection.general, optimized: optimization?.optimized_budget_projection.general ?? 0 },
  ];

  const marketKeyByLabel: Record<string, Market> = {
    Telugu: 'telugu',
    Bollywood: 'bollywood',
    Hollywood: 'hollywood',
    Korean: 'korean',
    General: 'general',
  };

  const getImpactBadgeClass = (impact: number) => {
    if (impact >= 8) return 'bg-red-500/15 text-red-300 border-red-500/35';
    if (impact >= 5) return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/35';
    return 'bg-green-500/15 text-green-300 border-green-500/35';
  };

  const hasOptimizationInsights = !!optimization && (optimization.primary_cost_drivers.length > 0 || optimization.optimization_strategies.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gradient-gold">Budget Simulation</h2>
        <div className="flex items-center gap-3">
          <Select value={market} onValueChange={(v: Market) => setMarket(v)}>
            <SelectTrigger className="w-48 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MARKET_CONFIG).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={starTier} onValueChange={setStarTier}>
            <SelectTrigger className="w-32 bg-secondary border-border">
              <SelectValue placeholder="Star Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Tier (Short Film)</SelectItem>
              <SelectItem value="A">Tier A</SelectItem>
              <SelectItem value="B">Tier B</SelectItem>
              <SelectItem value="C">Tier C</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Budget Source:</span>
        <Badge className={aiEstimatedBudget ? 'bg-green-500/15 text-green-300 border-green-500/35' : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/35'}>
          {aiEstimatedBudget ? 'AI Estimated' : 'Deterministic Fallback'}
        </Badge>
        {(aiBudgetLoading || optimizationLoading) && <span>AI is analyzing budget and optimization...</span>}
      </div>

      {/* Tier Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map(({ label, total, color, bg }) => (
          <div key={label} className={`glass-card p-6 border ${bg}`}>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={`text-3xl font-display font-bold ${color}`}>
              {formatCurrency(total, config.currency, config.symbol)}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold mb-4">Budget Breakdown by Category</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
            <XAxis dataKey="category" stroke="hsl(220 10% 55%)" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="hsl(220 10% 55%)"
              tick={{ fontSize: 11 }}
              tickFormatter={v => formatCurrency(v, config.currency, config.symbol)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220 18% 10%)',
                border: '1px solid hsl(220 15% 22%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => formatCurrency(value, config.currency, config.symbol)}
            />
            <Legend />
            <Bar dataKey="Low" fill="hsl(142 70% 45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mid" fill="hsl(43 60% 53%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="High" fill="hsl(0 75% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Drivers */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold mb-3">Key Cost Drivers</h3>
        <ul className="space-y-2">
          {displayBudget.cost_drivers.map((driver, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">▸</span>
              {driver}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold">💡 AI Optimization Insights</h3>
          {optimization && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Potential Savings</p>
              <p className="text-2xl font-bold text-green-400 animate-pulse">
                {optimization.total_savings_percentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {optimizationLoading && (
          <p className="text-sm text-muted-foreground">Evaluating optimization opportunities...</p>
        )}

        {!optimizationLoading && !hasTriedOptimization && (
          <p className="text-sm text-muted-foreground">AI optimization is initializing...</p>
        )}

        {!optimizationLoading && hasTriedOptimization && !optimization && (
          <p className="text-sm text-destructive">Optimization insights are unavailable right now. Please retry.</p>
        )}

        {!optimizationLoading && optimization && (
          <>
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">🔥 Top Cost Drivers</h4>
              <div className="space-y-2">
                {optimization.primary_cost_drivers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No primary cost drivers returned.</p>
                )}
                {optimization.primary_cost_drivers.map((driver, i) => (
                  <div key={`${driver.category}-${i}`} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{driver.category}</p>
                      <Badge className={getImpactBadgeClass(driver.impact_level)}>Impact {driver.impact_level.toFixed(1)}/10</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{driver.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {!!optimization.hidden_cost_drivers?.length && (
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">Hidden Cost Drivers</h4>
                <ul className="space-y-2">
                  {optimization.hidden_cost_drivers.map((driver, i) => (
                    <li key={`${driver}-${i}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-300 mt-0.5">•</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">🛠 Suggested Optimizations</h4>
              <div className="space-y-2">
                {optimization.optimization_strategies.length === 0 && (
                  <p className="text-sm text-muted-foreground">No optimization strategies returned.</p>
                )}
                {optimization.optimization_strategies.map((item, i) => (
                  <div key={`${item.strategy}-${i}`} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{item.strategy}</p>
                      <span className="text-xs font-semibold text-green-400">-{item.expected_savings_percentage.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.implementation_notes}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">💰 Optimized Budget vs Original</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={optimizationChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                  <XAxis dataKey="market" stroke="hsl(220 10% 55%)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(220 10% 55%)" tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1_000)}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220 18% 10%)',
                      border: '1px solid hsl(220 15% 22%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, _name, item: any) => {
                      const marketKey = marketKeyByLabel[item?.payload?.market] ?? 'general';
                      const marketConfig = MARKET_CONFIG[marketKey];
                      return formatCurrency(value, marketConfig.currency, marketConfig.symbol);
                    }}
                  />
                  <Legend />
                  <Bar dataKey="original" fill="hsl(43 60% 53%)" radius={[4, 4, 0, 0]} name="Original" />
                  <Bar dataKey="optimized" fill="hsl(142 70% 45%)" radius={[4, 4, 0, 0]} name="Optimized" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {!!optimization.quality_tradeoff_assessment && (
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">⚖ Quality Tradeoff Summary</h4>
                <p className="text-sm text-muted-foreground">{optimization.quality_tradeoff_assessment}</p>
              </div>
            )}

            {!hasOptimizationInsights && (
              <p className="text-sm text-muted-foreground">Optimization completed, but the response had limited insight detail.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
