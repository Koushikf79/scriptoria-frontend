import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { postJson } from '@/lib/api-client';
import { AnimationRequest, AnimationResponse, SceneDto } from '@/lib/types';
import { Loader2, X } from 'lucide-react';

interface SceneAnimationCardProps {
  scene: SceneDto;
  onClose: () => void;
}

const GOLD = '#D4AF37';

const MOOD_BADGE_COLORS: Record<string, string> = {
  TENSION: '#ff4444',
  JOY: '#44ff88',
  GRIEF: '#4488ff',
  FEAR: '#aa44ff',
  ANGER: '#ff6600',
  HOPE: '#ffdd44',
  LOVE: '#ff44aa',
  NEUTRAL: '#888888',
};

function parseCssString(css: string): CSSProperties {
  if (!css) return {};
  const result: Record<string, string> = {};

  css.split(';').forEach((rule) => {
    const [prop, ...vals] = rule.split(':');
    if (prop && vals.length) {
      const camel = prop.trim().replace(/-([a-z])/g, (_match, c: string) => c.toUpperCase());
      result[camel] = vals.join(':').trim();
    }
  });

  return result as CSSProperties;
}

function getMoodColor(mood: string): string {
  return MOOD_BADGE_COLORS[mood] || MOOD_BADGE_COLORS.NEUTRAL;
}

function normalizeAnimationResponse(raw: any): AnimationResponse | null {
  const payload = raw?.data ?? raw;
  if (!payload) return null;
  if (!payload.animationName || !payload.cssKeyframes) return null;
  return payload as AnimationResponse;
}

function ParticleOverlay({ type }: { type: AnimationResponse['particleEffect'] }) {
  const particles = useMemo(() => {
    const count = type === 'rain' ? 34 : 28;
    return Array.from({ length: count }).map((_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 2.2,
      duration: 1.6 + Math.random() * 2.6,
      size: 1 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.6,
    }));
  }, [type]);

  if (type === 'none') return null;

  return (
    <>
      {particles.map((particle) => {
        const commonStyle: CSSProperties = {
          position: 'absolute',
          left: `${particle.left}%`,
          animationDelay: `${particle.delay}s`,
          animationDuration: `${particle.duration}s`,
          opacity: particle.opacity,
        };

        if (type === 'rain') {
          return (
            <span
              key={particle.id}
              style={{
                ...commonStyle,
                top: '-14%',
                width: '1px',
                height: `${10 + particle.size * 6}px`,
                background: 'rgba(173, 216, 230, 0.7)',
                transform: 'skewX(-10deg)',
                animationName: 'scene-rain-fall',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            />
          );
        }

        if (type === 'stars') {
          return (
            <span
              key={particle.id}
              style={{
                ...commonStyle,
                top: `${Math.random() * 70}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                borderRadius: '50%',
                background: 'rgba(245, 245, 255, 0.95)',
                boxShadow: '0 0 8px rgba(255,255,255,0.65)',
                animationName: 'scene-star-twinkle',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
              }}
            />
          );
        }

        if (type === 'embers') {
          return (
            <span
              key={particle.id}
              style={{
                ...commonStyle,
                bottom: '-8%',
                width: `${2 + particle.size}px`,
                height: `${2 + particle.size}px`,
                borderRadius: '50%',
                background: 'rgba(255, 148, 64, 0.95)',
                boxShadow: '0 0 10px rgba(255, 130, 48, 0.65)',
                animationName: 'scene-embers-rise',
                animationTimingFunction: 'ease-out',
                animationIterationCount: 'infinite',
              }}
            />
          );
        }

        if (type === 'leaves') {
          return (
            <span
              key={particle.id}
              style={{
                ...commonStyle,
                top: '-10%',
                width: `${4 + particle.size}px`,
                height: `${3 + particle.size}px`,
                borderRadius: '55% 45% 55% 45%',
                background: 'rgba(170, 123, 60, 0.85)',
                animationName: 'scene-leaf-drift',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            />
          );
        }

        return (
          <span
            key={particle.id}
            style={{
              ...commonStyle,
              bottom: '-10%',
              width: `${2 + particle.size}px`,
              height: `${2 + particle.size}px`,
              borderRadius: '50%',
              background: 'rgba(210, 196, 165, 0.75)',
              animationName: 'scene-dust-float',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          />
        );
      })}
    </>
  );
}

export default function SceneAnimationCard({ scene, onClose }: SceneAnimationCardProps) {
  const [animData, setAnimData] = useState<AnimationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackCameraMovement = scene.actionIntensity >= 8
    ? 'HANDHELD PUSH'
    : scene.actionIntensity >= 5
    ? 'DOLLY IN'
    : 'SLOW PAN';
  const sceneCameraMovement = (scene as SceneDto & { cameraMovement?: string }).cameraMovement ?? fallbackCameraMovement;

  useEffect(() => {
    const payload: AnimationRequest = {
      sceneNumber: scene.sceneNumber,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      dominantEmotion: scene.dominantEmotion,
      actionIntensity: scene.actionIntensity,
      cameraMovement: sceneCameraMovement,
      description: scene.description,
      characters: scene.characters,
      hasVfx: scene.hasVfx,
    };

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setAnimData(null);
      try {
        const response = await postJson<any>('/api/v1/animation/generate', payload);
        const normalized = normalizeAnimationResponse(response);
        if (!normalized) {
          throw new Error('Animation payload is empty or missing keyframe fields');
        }
        if (!cancelled) {
          setAnimData(normalized);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Animation generation failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [scene]);

  useEffect(() => {
    if (!animData?.cssKeyframes || !animData?.animationName) return;

    const styleId = `anim-style-${animData.animationName}`;
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = animData.cssKeyframes;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [animData]);

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '320px',
    borderRadius: '12px',
    overflow: 'hidden',
    animation: animData
      ? `${animData.animationName} ${animData.animationDuration} ${animData.animationTimingFunction} ${animData.animationIterationCount}`
      : 'none',
    ...parseCssString(animData?.containerStyles ?? ''),
  };

  return (
    <div
      style={{
        width: 'min(860px, 92vw)',
        background: '#0a0a0f',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        color: '#f2e7c9',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>
        {`@keyframes scene-rain-fall { from { transform: translateY(-10%); } to { transform: translateY(125%); } }
          @keyframes scene-star-twinkle { 0%,100% { opacity: .25; transform: scale(1); } 50% { opacity: 1; transform: scale(1.45); } }
          @keyframes scene-dust-float { 0% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-80px) translateX(20px); } 100% { transform: translateY(-160px) translateX(-16px); opacity: 0; } }
          @keyframes scene-embers-rise { from { transform: translateY(0) scale(1); opacity: .85; } to { transform: translateY(-180px) scale(0.6); opacity: 0; } }
          @keyframes scene-leaf-drift { 0% { transform: translateY(-10px) translateX(0) rotate(0deg); } 100% { transform: translateY(130%) translateX(35px) rotate(300deg); } }
          @keyframes scene-light-flicker { 0%, 100% { opacity: 1; } 30% { opacity: .88; } 65% { opacity: .94; } 80% { opacity: .86; } }`}
      </style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: `1px solid rgba(212, 175, 55, 0.22)` }}>
        <div style={{ fontFamily: 'Courier New, monospace', letterSpacing: 1.2 }}>
          <div style={{ fontSize: 13, color: GOLD }}>SCENE {scene.sceneNumber}</div>
          <div style={{ fontSize: 14, color: '#ddd3b7' }}>{`${scene.interior}. ${scene.location} - ${scene.timeOfDay}`}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close animation preview"
          style={{ border: '1px solid rgba(212, 175, 55, 0.3)', background: 'transparent', color: GOLD, borderRadius: 8, padding: 6, cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {loading && (
          <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
            <p style={{ color: '#b7ab85', fontSize: 13 }}>Generating cinematic animation...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center', color: '#fca5a5', padding: 16 }}>
            <div>
              <p style={{ marginBottom: 8, fontWeight: 700 }}>Animation service unavailable</p>
              <p style={{ color: '#fecaca', fontSize: 13 }}>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div style={containerStyle}>
            {animData && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${animData.colorGrade.shadows} 0%, ${animData.colorGrade.midtones} 50%, ${animData.colorGrade.highlights}22 100%)`,
                  opacity: 0.9,
                }}
              />
            )}

            {animData?.overlayEffect && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: animData.overlayEffect,
                  mixBlendMode: 'screen',
                }}
              />
            )}

            {animData && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${animData.vignetteIntensity}) 100%)`,
                }}
              />
            )}

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <ParticleOverlay type={animData?.particleEffect ?? 'none'} />
            </div>

            {animData?.lightFlicker && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: 'linear-gradient(180deg, rgba(255,250,230,0.08), rgba(0,0,0,0.1))',
                  animation: 'scene-light-flicker 0.35s steps(2, end) infinite',
                }}
              />
            )}

            <div
              style={{
                position: 'relative',
                zIndex: 10,
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                ...parseCssString(animData?.textStyles ?? ''),
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    color: '#D4AF37',
                    textTransform: 'uppercase',
                  }}
                >
                  SCENE {scene.sceneNumber}
                </span>
                <span
                  style={{
                    background: getMoodColor(scene.dominantEmotion),
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    letterSpacing: '1px',
                  }}
                >
                  {scene.dominantEmotion}
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '0 0 20px rgba(212,175,55,0.5)',
                  lineHeight: 1.3,
                }}
              >
                {animData?.sceneLabel ?? `${scene.interior}. ${scene.location} - ${scene.timeOfDay}`}
              </div>

              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6,
                  maxWidth: '80%',
                }}
              >
                {scene.description}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', color: '#D4AF37', letterSpacing: '1px' }}>
                  ◈ {scene.characters?.join(' · ')}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                  {sceneCameraMovement} · {animData?.animationDuration ?? '3s'}
                </div>
                {animData?.directorHint && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(212,175,55,0.6)',
                      fontStyle: 'italic',
                      borderTop: '1px solid rgba(212,175,55,0.2)',
                      paddingTop: '8px',
                      marginTop: '4px',
                    }}
                  >
                    "{animData.directorHint}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
