import {
  ScriptAnalysisResponse,
  EmotionAnalysisResponse,
  BudgetSimulationResponse,
} from './types';
import { API_V1, WS_API, ensureApiConfigured } from '@/config';

export interface AnalysisCallbacks {
  onProgress: (stage: string, percentage: number, message: string) => void;
  onAnalysis: (data: ScriptAnalysisResponse) => void;
  onEmotion: (data: EmotionAnalysisResponse) => void;
  onBudget: (data: BudgetSimulationResponse) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

// Get WebSocket URL from environment or construct it
const getWebSocketUrl = (): string => {
  ensureApiConfigured('getWebSocketUrl');
  const token = localStorage.getItem('scriptoria_token') || '';
  const searchParams = new URLSearchParams({ token });
  return `${WS_API}/ws/analyze?${searchParams.toString()}`;
};

/**
 * Run screenplay analysis via WebSocket connection.
 * Returns a cleanup function to close the socket.
 */
export function runAnalysis(
  screenplay: string,
  market: 'TOLLYWOOD' | 'BOLLYWOOD' | 'HOLLYWOOD' | 'KOREAN' | 'GENERAL',
  callbacks: AnalysisCallbacks
): () => void {
  const wsUrl = getWebSocketUrl();
  console.log('[Scriptoria] Connecting to WebSocket:', wsUrl);
  
  const ws = new WebSocket(wsUrl);

  const cleanup = () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };

  ws.onopen = () => {
    console.log('[Scriptoria] WebSocket connected');
    ws.send(JSON.stringify({ screenplay, market }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('[Scriptoria] WebSocket message:', msg.type);

      switch (msg.type) {
        case 'PROGRESS':
          callbacks.onProgress(msg.stage, msg.percentage, msg.message);
          break;
        case 'ANALYSIS':
          callbacks.onAnalysis(msg.data);
          break;
        case 'EMOTION':
          callbacks.onEmotion(msg.data);
          break;
        case 'BUDGET':
          callbacks.onBudget(msg.data);
          break;
        case 'COMPLETE':
          callbacks.onComplete();
          cleanup();
          break;
        case 'ERROR':
          callbacks.onError(msg.message);
          cleanup();
          break;
        default:
          console.warn('[Scriptoria] Unknown message type:', msg.type);
      }
    } catch (err) {
      console.error('[Scriptoria] Failed to parse WebSocket message:', err);
      callbacks.onError('Failed to parse server response');
      cleanup();
    }
  };

  ws.onerror = (event) => {
    console.error('[Scriptoria] WebSocket error:', event);
    callbacks.onError('Failed to connect to analysis service. Check VITE_API_URL and backend availability.');
    cleanup();
  };

  ws.onclose = () => {
    console.log('[Scriptoria] WebSocket closed');
  };

  return cleanup;
}

/**
 * Generate storyboard frames for a scene via REST POST.
 */
export async function generateStoryboard(
  sceneNumber: number,
  sceneDescription: string,
  location: string,
  timeOfDay: string,
  dominantEmotion: string,
  actionIntensity: number
) {
  try {
    ensureApiConfigured('generateStoryboard');
    const url = `${API_V1}/storyboard/generate`;

    console.log('[Scriptoria] Generating storyboard at:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneNumber,
        sceneDescription,
        location,
        timeOfDay,
        dominantEmotion,
        actionIntensity,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Scriptoria] Storyboard generation failed:', {
        status: response.status,
        error,
      });
      throw new Error(`Storyboard generation failed: ${error}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Scriptoria] Storyboard request error:', error);
    throw error;
  }
}
