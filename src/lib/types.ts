export interface SceneData {
  scene_number: number;
  location: string;
  time_of_day: string;
  characters: string[];
  action_intensity: number;
  emotional_intensity: number;
  production_complexity: number;
  description: string;
}

export interface EmotionData {
  scene_number: number;
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  tension: number;
  overall_intensity: number;
}

export interface BudgetCategory {
  category: string;
  low: number;
  mid: number;
  high: number;
}

export interface BudgetSimulation {
  market: string;
  currency: string;
  total_low: number;
  total_mid: number;
  total_high: number;
  breakdown: BudgetCategory[];
  cost_drivers: string[];
}

export interface BudgetCostDriver {
  category: string;
  impact_level: number;
  reason: string;
}

export interface BudgetOptimizationStrategy {
  strategy: string;
  implementation_notes: string;
  expected_savings_percentage: number;
}

export interface BudgetProjectionByMarket {
  telugu: number;
  bollywood: number;
  hollywood: number;
  korean: number;
  general: number;
}

export interface BudgetOptimizationInsight {
  primary_cost_drivers: BudgetCostDriver[];
  hidden_cost_drivers?: string[];
  optimization_strategies: BudgetOptimizationStrategy[];
  optimized_budget_projection: BudgetProjectionByMarket;
  total_savings_percentage: number;
  quality_tradeoff_assessment?: string;
}

export interface AIBudgetEstimate {
  total_low: number;
  total_mid: number;
  total_high: number;
  breakdown: BudgetCategory[];
  cost_drivers: string[];
  confidence_score?: number;
}

export interface StoryboardVariation {
  angle: string;
  prompt: string;
  camera: string;
  lens: string;
  lighting: string;
  mood: string;
  composition: string;
}

export interface AnalysisResult {
  scenes: SceneData[];
  emotions: EmotionData[];
  budget: BudgetSimulation;
  summary: {
    total_scenes: number;
    total_characters: number;
    avg_action_intensity: number;
    avg_emotional_intensity: number;
    avg_production_complexity: number;
    unique_locations: number;
    night_scenes: number;
  };
}

export type Market = 'telugu' | 'bollywood' | 'hollywood' | 'korean' | 'general';

export const MARKET_CONFIG: Record<Market, { label: string; currency: string; symbol: string }> = {
  telugu: { label: 'Telugu / Tollywood', currency: 'INR', symbol: '₹' },
  bollywood: { label: 'Bollywood', currency: 'INR', symbol: '₹' },
  hollywood: { label: 'Hollywood', currency: 'USD', symbol: '$' },
  korean: { label: 'Korean', currency: 'KRW', symbol: '₩' },
  general: { label: 'General', currency: 'USD', symbol: '$' },
};

// ============================================================================
// Backend API Response Types (WebSocket & REST)
// ============================================================================

export interface SceneDto {
  sceneNumber: number;
  location: string;
  timeOfDay: 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK' | 'CONTINUOUS';
  interior: 'INT' | 'EXT' | 'INT/EXT';
  characters: string[];
  description: string;
  actionIntensity: number;
  emotionalIntensity: number;
  productionComplexity: number;
  dominantEmotion: 'TENSION' | 'JOY' | 'GRIEF' | 'FEAR' | 'ANGER' | 'HOPE' | 'LOVE' | 'NEUTRAL';
  hasVfx: boolean;
  hasStunt: boolean;
  hasLargecrowd: boolean;
}

export interface ScriptAnalysisResponse {
  totalScenes: number;
  genre: string;
  scriptTone: string;
  allCharacters: string[];
  avgActionIntensity: number;
  avgEmotionalIntensity: number;
  avgProductionComplexity: number;
  nightScenesCount: number;
  extScenesCount: number;
  vfxScenesCount: number;
  locationFrequency: Record<string, number>;
  characterFrequency: Record<string, number>;
  scenes: SceneDto[];
}

export interface EmotionPoint {
  sceneNumber: number;
  location: string;
  tension: number;
  joy: number;
  grief: number;
  fear: number;
  anger: number;
  hope: number;
  love: number;
  dominantEmotion: string;
  emotionNote: string;
}

export interface EmotionAnalysisResponse {
  arc: EmotionPoint[];
  overallProfile: Record<string, number>;
  dominantTone: string;
  peakTensionScene: number;
  peakJoyScene: number;
  emotionalJourney: string;
}

export interface BudgetTier {
  tier: string;
  currency: string;
  totalBudget: number;
  castBudget: number;
  locationsBudget: number;
  vfxBudget: number;
  crewBudget: number;
  postProductionBudget: number;
  marketingBudget: number;
  contingency: number;
  keyAssumptions: string[];
}

export interface BudgetSimulationResponse {
  market: string;
  currency: string;
  costDrivers: string[];
  totalNightScenes: number;
  totalVfxScenes: number;
  totalUniqueLocations: number;
  avgActionIntensity: number;
  marketContext: string;
  low: BudgetTier;
  mid: BudgetTier;
  high: BudgetTier;
}

export interface ShotVariation {
  shotType: string;
  lightingStyle: string;
  lens: string;
  cameraMovement: string;
  mood: string;
  composition: string;
  colorGrading: string;
  detailedPrompt: string;
}

export interface StoryboardResponse {
  sceneNumber: number;
  sceneDescription: string;
  location: string;
  timeOfDay: string;
  directorNote: string;
  variations: ShotVariation[];
}

export interface AnimationRequest {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  dominantEmotion: string;
  actionIntensity: number;
  cameraMovement: string;
  description: string;
  characters: string[];
  hasVfx: boolean;
}

export interface ColorGrade {
  shadows: string;
  midtones: string;
  highlights: string;
  saturation: number;
}

export interface AnimationResponse {
  sceneNumber: number;
  animationName: string;
  cssKeyframes: string;
  containerStyles: string;
  colorGrade: ColorGrade;
  overlayEffect: string;
  particleEffect: 'rain' | 'stars' | 'dust' | 'leaves' | 'embers' | 'none';
  animationDuration: string;
  animationTimingFunction: string;
  animationIterationCount: string;
  lightFlicker: boolean;
  vignetteIntensity: number;
  textStyles: string;
  sceneLabel: string;
  moodTag: string;
  directorHint: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  userId: string;
  expiresIn: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  createdAt: string;
  totalAnalyses: number;
}

export interface HistoryItem {
  id: string;
  screenplayTitle: string;
  genre: string;
  scriptTone: string;
  totalScenes: number;
  market: string;
  createdAt: string;
  avgActionIntensity: number;
  avgEmotionalIntensity: number;
  dominantEmotion: string;
  peakTensionScene: number;
  totalBudgetLow: number;
  totalBudgetMid: number;
  totalBudgetHigh: number;
  currency: string;
  dominantTone: string;
  emotionalJourney: string;
}

export interface HistoryDetail extends HistoryItem {
  analysisData: ScriptAnalysisResponse;
  emotionData: EmotionAnalysisResponse;
  budgetData: BudgetSimulationResponse;
  storyboardSnapshots: StoryboardResponse[];
}

export interface HistoryPageResponse {
  items: HistoryItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProductionRiskFactor {
  factor: string;
  description: string;
  severity: number;
  mitigation?: string;
}

export interface HiddenCostDriver {
  category: string;
  explanation: string;
  estimated_budget_increase_percentage: number;
}

export interface ProductionRiskAssessment {
  overall_risk_score: number;
  risk_factors: ProductionRiskFactor[];
  hidden_cost_drivers: HiddenCostDriver[];
  schedule_complexity_score: number;
  vfx_dependency_score: number;
  crowd_management_risk: number;
  weather_dependency_risk: number;
  star_scheduling_risk: number;
}

export interface WhatIfAdjustments {
  action_modification?: string;
  emotion_target?: string;
  star_tier_adjustment?: string;
  market_reposition?: string;
}

export interface WhatIfCurvePoint {
  scene_number: number;
  overall_intensity: number;
}

export interface WhatIfBudgetProjection {
  total_budget_change_usd: number;
  primary_cost_driver: string;
}

export interface WhatIfMarketViabilityShift {
  domestic_change: number;
  international_change: number;
}

export interface WhatIfSimulationResult {
  adjusted_emotion_curve: WhatIfCurvePoint[];
  adjusted_budget_projection: WhatIfBudgetProjection;
  market_viability_shift: WhatIfMarketViabilityShift;
  narrative_strength_delta: number;
}
