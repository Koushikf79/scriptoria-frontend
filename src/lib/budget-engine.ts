import { SceneData, BudgetSimulation, Market, MARKET_CONFIG } from './types';

const MARKET_MULTIPLIERS: Record<Market, { base: number; cast: number; vfx: number; location: number }> = {
  telugu: { base: 1, cast: 1, vfx: 0.8, location: 0.7 },
  bollywood: { base: 1.5, cast: 2, vfx: 1, location: 1 },
  hollywood: { base: 10, cast: 15, vfx: 8, location: 5 },
  korean: { base: 3, cast: 4, vfx: 3, location: 2 },
  general: { base: 5, cast: 6, vfx: 4, location: 3 },
};

export function simulateBudget(scenes: SceneData[], market: Market): BudgetSimulation {
  const config = MARKET_CONFIG[market];
  const mult = MARKET_MULTIPLIERS[market];

  const nightScenes = scenes.filter(s => s.time_of_day.toUpperCase().includes('NIGHT')).length;
  const avgAction = scenes.reduce((a, s) => a + s.action_intensity, 0) / scenes.length;
  const avgComplexity = scenes.reduce((a, s) => a + s.production_complexity, 0) / scenes.length;
  const uniqueLocations = new Set(scenes.map(s => s.location)).size;
  const totalChars = new Set(scenes.flatMap(s => s.characters)).size;

  const baseUnit = 10000000; // 1 crore INR baseline

  const castBase = baseUnit * mult.cast * (totalChars / 5) * (avgAction > 6 ? 1.5 : 1);
  const locationBase = baseUnit * mult.location * (uniqueLocations / 3) * (nightScenes > 0 ? 1.3 : 1);
  const vfxBase = baseUnit * mult.vfx * (avgComplexity / 5) * (avgAction / 5);
  const crewBase = baseUnit * mult.base * 0.5 * (scenes.length / 5);
  const musicBase = baseUnit * mult.base * 0.2;
  const marketingBase = baseUnit * mult.base * 0.15;

  const makeTier = (factor: number) => ({
    cast: Math.round(castBase * factor),
    locations: Math.round(locationBase * factor),
    vfx: Math.round(vfxBase * factor),
    crew: Math.round(crewBase * factor),
    music: Math.round(musicBase * factor),
    marketing: Math.round(marketingBase * factor),
  });

  const low = makeTier(0.6);
  const mid = makeTier(1);
  const high = makeTier(2.2);

  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

  const cost_drivers: string[] = [];
  if (nightScenes > 0) cost_drivers.push(`${nightScenes} night scene(s) requiring extensive lighting rigs`);
  if (avgAction > 6) cost_drivers.push('High action intensity requiring stunt coordination & safety');
  if (avgComplexity > 7) cost_drivers.push('High production complexity demanding elaborate sets/VFX');
  if (uniqueLocations > 4) cost_drivers.push(`${uniqueLocations} unique locations increasing logistics costs`);
  if (totalChars > 5) cost_drivers.push(`${totalChars} characters potentially requiring ensemble cast`);

  return {
    market,
    currency: config.currency,
    total_low: sum(low),
    total_mid: sum(mid),
    total_high: sum(high),
    breakdown: [
      { category: 'Cast & Talent', low: low.cast, mid: mid.cast, high: high.cast },
      { category: 'Locations & Sets', low: low.locations, mid: mid.locations, high: high.locations },
      { category: 'VFX & Post', low: low.vfx, mid: mid.vfx, high: high.vfx },
      { category: 'Crew & Equipment', low: low.crew, mid: mid.crew, high: high.crew },
      { category: 'Music & Sound', low: low.music, mid: mid.music, high: high.music },
      { category: 'Marketing', low: low.marketing, mid: mid.marketing, high: high.marketing },
    ],
    cost_drivers,
  };
}
