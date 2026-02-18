import { useState } from 'react';
import ScriptoriaLayout from '@/components/ScriptoriaLayout';
import HeroInput from '@/components/HeroInput';
import DashboardPanel from '@/components/DashboardPanel';
import SceneAnalysisPanel from '@/components/SceneAnalysisPanel';
import EmotionGraphPanel from '@/components/EmotionGraphPanel';
import BudgetPanel from '@/components/BudgetPanel';
import DirectorPanel from '@/components/DirectorPanel';
import { AnalysisResult, SceneData } from '@/lib/types';
import { MOCK_ANALYSIS } from '@/lib/mock-data';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [directorScene, setDirectorScene] = useState<SceneData | undefined>();
  const { toast } = useToast();

  const handleAnalyze = async (script: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('script-analyzer', {
        body: { script },
      });

      if (error) throw error;

      if (data?.scenes && data.scenes.length > 0) {
        // We got real AI data — also try emotion analysis
        let emotions = data.emotions;
        if (!emotions || emotions.length === 0) {
          try {
            const emotionResp = await supabase.functions.invoke('emotion-analyzer', {
              body: { scenes: data.scenes },
            });
            if (emotionResp.data?.emotions) emotions = emotionResp.data.emotions;
          } catch {
            // fallback to mock emotions
          }
        }

        const scenes: SceneData[] = data.scenes;
        const summary = {
          total_scenes: scenes.length,
          total_characters: new Set(scenes.flatMap(s => s.characters)).size,
          avg_action_intensity: scenes.reduce((a, s) => a + s.action_intensity, 0) / scenes.length,
          avg_emotional_intensity: scenes.reduce((a, s) => a + s.emotional_intensity, 0) / scenes.length,
          avg_production_complexity: scenes.reduce((a, s) => a + s.production_complexity, 0) / scenes.length,
          unique_locations: new Set(scenes.map(s => s.location)).size,
          night_scenes: scenes.filter(s => s.time_of_day.toUpperCase().includes('NIGHT')).length,
        };

        const { simulateBudget } = await import('@/lib/budget-engine');
        const budget = simulateBudget(scenes, 'telugu');

        setAnalysis({
          scenes,
          emotions: emotions || MOCK_ANALYSIS.emotions,
          budget,
          summary,
        });
      } else {
        // Fallback to mock
        toast({ title: 'Using preview data', description: 'AI analysis unavailable, showing sample results.' });
        setAnalysis(MOCK_ANALYSIS);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err?.message?.includes('429') || err?.status === 429) {
        toast({ title: 'Rate limited', description: 'Too many requests. Please wait and try again.', variant: 'destructive' });
      } else if (err?.message?.includes('402') || err?.status === 402) {
        toast({ title: 'Credits required', description: 'Please add credits to use AI features.', variant: 'destructive' });
      } else {
        toast({ title: 'Using preview data', description: 'AI unavailable, showing sample analysis.' });
      }
      setAnalysis(MOCK_ANALYSIS);
    } finally {
      setLoading(false);
      setActiveTab('dashboard');
    }
  };

  const handleSelectScene = (scene: SceneData) => {
    setDirectorScene(scene);
    setActiveTab('director');
  };

  return (
    <ScriptoriaLayout activeTab={activeTab} onTabChange={setActiveTab} hasAnalysis={!!analysis}>
      {!analysis ? (
        <HeroInput onAnalyze={handleAnalyze} loading={loading} />
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
