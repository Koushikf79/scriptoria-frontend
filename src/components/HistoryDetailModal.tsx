import { useMemo, useState } from 'react';
import {
  BudgetSimulation,
  EmotionData,
  HistoryDetail,
  SceneData,
  StoryboardResponse,
} from '@/lib/types';
import EmotionGraphPanel from '@/components/EmotionGraphPanel';
import BudgetPanel from '@/components/BudgetPanel';
import { X } from 'lucide-react';

interface HistoryDetailModalProps {
  detail: HistoryDetail;
  onClose: () => void;
}

type ModalTab = 'overview' | 'scenes' | 'emotions' | 'budget' | 'storyboards';

const TABS: Array<{ id: ModalTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'emotions', label: 'Emotions' },
  { id: 'budget', label: 'Budget' },
  { id: 'storyboards', label: 'Storyboards' },
];

function normalizeBudgetMarket(value: string): 'telugu' | 'bollywood' | 'hollywood' | 'korean' | 'general' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'telugu' || normalized === 'tollywood') return 'telugu';
  if (normalized === 'bollywood') return 'bollywood';
  if (normalized === 'hollywood') return 'hollywood';
  if (normalized === 'korean') return 'korean';
  return 'general';
}

function toSceneData(detail: HistoryDetail): SceneData[] {
  return detail.analysisData.scenes.map((scene) => ({
    scene_number: scene.sceneNumber,
    location: scene.location,
    time_of_day: scene.timeOfDay,
    characters: scene.characters,
    action_intensity: scene.actionIntensity,
    emotional_intensity: scene.emotionalIntensity,
    production_complexity: scene.productionComplexity,
    description: scene.description,
  }));
}

function toEmotionData(detail: HistoryDetail): EmotionData[] {
  return detail.emotionData.arc.map((point) => ({
    scene_number: point.sceneNumber,
    joy: point.joy,
    sadness: point.grief,
    anger: point.anger,
    fear: point.fear,
    surprise: 0,
    tension: point.tension,
    overall_intensity: point.hope,
  }));
}

function toBudgetSimulation(detail: HistoryDetail): BudgetSimulation {
  const budgetData = detail.budgetData;
  return {
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
}

function StoryboardCard({ board }: { board: StoryboardResponse }) {
  return (
    <div className="rounded-xl border border-amber-400/25 bg-white/[0.03] p-4 backdrop-blur-md space-y-2">
      <p className="text-xs text-amber-300 uppercase tracking-wider">Scene {board.sceneNumber}</p>
      <h4 className="text-lg font-semibold text-white">{board.sceneDescription}</h4>
      <p className="text-sm text-slate-300">{board.location} • {board.timeOfDay}</p>
      <p className="text-sm text-slate-400 italic">{board.directorNote}</p>
      <div className="grid gap-2">
        {board.variations.slice(0, 2).map((shot, index) => (
          <div key={`${board.sceneNumber}-${index}`} className="rounded-lg border border-amber-300/20 p-3 bg-black/20">
            <p className="text-xs text-amber-200">{shot.shotType}</p>
            <p className="text-xs text-slate-400">{shot.lens} • {shot.cameraMovement}</p>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">{shot.detailedPrompt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryDetailModal({ detail, onClose }: HistoryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');

  const scenes = useMemo(() => toSceneData(detail), [detail]);
  const emotions = useMemo(() => toEmotionData(detail), [detail]);
  const budget = useMemo(() => toBudgetSimulation(detail), [detail]);

  const dominantCharacters = Array.from(
    new Set(detail.analysisData.scenes.flatMap((scene) => scene.characters)),
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md p-4 md:p-8" onClick={onClose}>
      <div
        className="mx-auto h-full max-w-6xl rounded-2xl border border-amber-400/30 bg-[#0a0a0f] text-white shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-amber-400/20 p-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-amber-300">{detail.screenplayTitle}</h2>
            <p className="text-sm text-slate-300 mt-1">{detail.genre} • {detail.market} • {new Date(detail.createdAt).toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-amber-400/30 p-2 text-amber-200 hover:bg-amber-400/10 transition-colors"
            aria-label="Close history detail"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-amber-400/15 px-6 py-3 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-[#0a0a0f] font-semibold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="h-[calc(100%-132px)] overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-amber-400/20 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Scenes</p>
                <p className="text-3xl font-bold text-amber-300 mt-1">{detail.totalScenes}</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Genre</p>
                <p className="text-lg font-semibold mt-2">{detail.genre}</p>
                <p className="text-sm text-slate-400 mt-1">Tone: {detail.scriptTone}</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Dominant Emotion</p>
                <p className="text-lg font-semibold mt-2">{detail.dominantEmotion}</p>
                <p className="text-sm text-slate-400 mt-1">Peak tension scene {detail.peakTensionScene}</p>
              </div>

              <div className="md:col-span-3 rounded-xl border border-amber-400/20 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Characters</p>
                <div className="flex flex-wrap gap-2">
                  {dominantCharacters.map((name) => (
                    <span key={name} className="rounded-full border border-amber-300/30 px-3 py-1 text-xs text-amber-200">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scenes' && (
            <div className="space-y-3">
              {detail.analysisData.scenes.map((scene) => (
                <div key={scene.sceneNumber} className="rounded-xl border border-amber-400/20 bg-white/[0.03] p-4">
                  <p className="text-xs text-amber-300">SCENE {scene.sceneNumber}</p>
                  <p className="text-sm text-white mt-1">{scene.location} • {scene.timeOfDay} • {scene.interior}</p>
                  <p className="text-xs text-slate-300 mt-2">{scene.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'emotions' && <EmotionGraphPanel emotions={emotions} />}
          {activeTab === 'budget' && <BudgetPanel scenes={scenes} initialBudget={budget} />}

          {activeTab === 'storyboards' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detail.storyboardSnapshots.slice(0, 3).map((board, index) => (
                <StoryboardCard key={`${board.sceneNumber}-${index}`} board={board} />
              ))}
              {detail.storyboardSnapshots.length === 0 && (
                <p className="text-sm text-slate-400">No storyboard snapshots saved for this analysis.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
