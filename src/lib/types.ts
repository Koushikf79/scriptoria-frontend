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
