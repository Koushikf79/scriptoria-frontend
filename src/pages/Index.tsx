import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ScriptoriaLayout from '@/components/ScriptoriaLayout';
import HeroInput from '@/components/HeroInput';
import DashboardPanel from '@/components/DashboardPanel';
import SceneAnalysisPanel from '@/components/SceneAnalysisPanel';
import EmotionGraphPanel from '@/components/EmotionGraphPanel';
import BudgetPanel from '@/components/BudgetPanel';
import DirectorPanel from '@/components/DirectorPanel';
import { AnalysisResult, SceneData, ScriptAnalysisResponse, EmotionAnalysisResponse, BudgetSimulationResponse } from '@/lib/types';
import { runAnalysis } from '@/lib/analysis-socket';
import { useToast } from '@/hooks/use-toast';
import { API } from '@/config';
import { useAuth } from '@/store/authStore';

interface ProgressState {
  stage: string;
  percentage: number;
  message: string;
}

const STAGE_LABELS: Record<string, string> = {
  SCRIPT_ANALYSIS: 'Parsing scenes...',
  EMOTION_ANALYSIS: 'Mapping emotions...',
  BUDGET_SIMULATION: 'Calculating budget...',
  COMPLETE: 'Done',
};

const normalizeBudgetMarket = (value: string): 'telugu' | 'bollywood' | 'hollywood' | 'korean' | 'general' => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'telugu' || normalized === 'tollywood') return 'telugu';
  if (normalized === 'bollywood') return 'bollywood';
  if (normalized === 'hollywood') return 'hollywood';
  if (normalized === 'korean') return 'korean';
  return 'general';
};

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [directorScene, setDirectorScene] = useState<SceneData | undefined>();
  const [selectedMarket, setSelectedMarket] = useState<'TOLLYWOOD' | 'BOLLYWOOD' | 'HOLLYWOOD' | 'KOREAN' | 'GENERAL'>('TOLLYWOOD');
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const cleanupRef = useRef<(() => void) | null>(null);

  // Store raw API responses for later assembly
  const analysisDataRef = useRef<ScriptAnalysisResponse | null>(null);
  const emotionDataRef = useRef<EmotionAnalysisResponse | null>(null);
  const budgetDataRef = useRef<BudgetSimulationResponse | null>(null);

  const handleAnalyze = (script: string) => {
    const token = localStorage.getItem('scriptoria_token') ?? localStorage.getItem('token');
    if (!isAuthenticated || !token) {
      const message = 'Please login to run analysis.';
      setError(message);
      toast({ title: 'Authentication required', description: message, variant: 'destructive' });
      navigate('/login');
      return;
    }

    if (!API) {
      const message = 'API URL is missing. Set VITE_API_URL before running analysis.';
      console.error('API Error:', message);
      setError(message);
      toast({ title: 'Configuration error', description: message, variant: 'destructive' });
      return;
    }

    // Reset state
    setIsAnalyzing(true);
    setProgress(null);
    setError(null);
    analysisDataRef.current = null;
    emotionDataRef.current = null;
    budgetDataRef.current = null;

    // Cleanup any previous connection
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Start WebSocket analysis
    cleanupRef.current = runAnalysis(script, selectedMarket, {
      onProgress: (stage: string, percentage: number, message: string) => {
        setProgress({
          stage,
          percentage: Math.min(percentage, 99),
          message: STAGE_LABELS[stage] || stage,
        });
      },
      onAnalysis: (data: ScriptAnalysisResponse) => {
        analysisDataRef.current = data;
      },
      onEmotion: (data: EmotionAnalysisResponse) => {
        emotionDataRef.current = data;
      },
      onBudget: (data: BudgetSimulationResponse) => {
        budgetDataRef.current = data;
      },
      onComplete: () => {
        // Assemble the analysis result from collected data
        if (analysisDataRef.current && emotionDataRef.current && budgetDataRef.current) {
          const scriptData = analysisDataRef.current;
          const emotionData = emotionDataRef.current;
          const budgetData = budgetDataRef.current;

          // Convert SceneDto to SceneData for compatibility
          const scenes: SceneData[] = scriptData.scenes.map((scene) => ({
            scene_number: scene.sceneNumber,
            location: scene.location,
            time_of_day: scene.timeOfDay,
            characters: scene.characters,
            action_intensity: scene.actionIntensity,
            emotional_intensity: scene.emotionalIntensity,
            production_complexity: scene.productionComplexity,
            description: scene.description,
          }));

          // Convert EmotionAnalysisResponse to EmotionData array
          const emotions = emotionData.arc.map((point) => ({
            scene_number: point.sceneNumber,
            joy: point.joy,
            sadness: point.grief,
            anger: point.anger,
            fear: point.fear,
            surprise: 0,
            tension: point.tension,
            overall_intensity: point.hope,
          }));

          // Convert BudgetSimulationResponse to BudgetSimulation for compatibility
          const budget = {
            market: normalizeBudgetMarket(budgetData.market),
            currency: budgetData.currency,
            total_low: budgetData.low.totalBudget,
            total_mid: budgetData.mid.totalBudget,
            total_high: budgetData.high.totalBudget,
            breakdown: [
              { category: 'Cast', low: budgetData.low.castBudget, mid: budgetData.mid.castBudget, high: budgetData.high.castBudget },
              { category: 'Locations', low: budgetData.low.locationsBudget, mid: budgetData.mid.locationsBudget, high: budgetData.high.locationsBudget },
              { category: 'VFX', low: budgetData.low.vfxBudget, mid: budgetData.mid.vfxBudget, high: budgetData.high.vfxBudget },
              { category: 'Crew', low: budgetData.low.crewBudget, mid: budgetData.mid.crewBudget, high: budgetData.high.crewBudget },
              { category: 'Post-Production', low: budgetData.low.postProductionBudget, mid: budgetData.mid.postProductionBudget, high: budgetData.high.postProductionBudget },
              { category: 'Marketing', low: budgetData.low.marketingBudget, mid: budgetData.mid.marketingBudget, high: budgetData.high.marketingBudget },
            ],
            cost_drivers: budgetData.costDrivers,
          };

          const summary = {
            total_scenes: scriptData.totalScenes,
            total_characters: scriptData.allCharacters.length,
            avg_action_intensity: scriptData.avgActionIntensity,
            avg_emotional_intensity: scriptData.avgEmotionalIntensity,
            avg_production_complexity: scriptData.avgProductionComplexity,
            unique_locations: Object.keys(scriptData.locationFrequency).length,
            night_scenes: scriptData.nightScenesCount,
          };

          setAnalysis({
            scenes,
            emotions,
            budget,
            summary,
          });

          setProgress({ stage: 'COMPLETE', percentage: 100, message: STAGE_LABELS['COMPLETE'] });
          toast({ title: 'Analysis complete', description: 'Your screenplay has been analyzed successfully.' });
          setActiveTab('dashboard');
        }
        setIsAnalyzing(false);
      },
      onError: (message: string) => {
        setError(message);
        setIsAnalyzing(false);
        toast({ title: 'Analysis failed', description: message, variant: 'destructive' });
      },
    });
  };

  const handleSelectScene = (scene: SceneData) => {
    setDirectorScene(scene);
    setActiveTab('director');
  };

  return (
    <ScriptoriaLayout activeTab={activeTab} onTabChange={setActiveTab} hasAnalysis={!!analysis}>
      {!analysis ? (
        <HeroInput 
          onAnalyze={handleAnalyze} 
          loading={isAnalyzing} 
          selectedMarket={selectedMarket}
          onMarketChange={setSelectedMarket}
          progress={progress}
          error={error}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && <DashboardPanel analysis={analysis} onNavigate={setActiveTab} />}
          {activeTab === 'scenes' && <SceneAnalysisPanel scenes={analysis.scenes} onSelectScene={handleSelectScene} />}
          {activeTab === 'emotions' && <EmotionGraphPanel emotions={analysis.emotions} />}
          {activeTab === 'budget' && <BudgetPanel scenes={analysis.scenes} initialBudget={analysis.budget} />}
          {activeTab === 'director' && <DirectorPanel scenes={analysis.scenes} initialScene={directorScene} />}
        </>
      )}
    </ScriptoriaLayout>
  );
};

export default Index;
