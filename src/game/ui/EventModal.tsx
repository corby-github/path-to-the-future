import { useEffect, useState } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppSelector } from '../state/hooks';
import { interpolate } from '../content/interpolate';
import { ScenePlayer } from './ScenePlayer';
import { EffectChips } from './EffectChips';
import type { EventDef } from '../types/careerPack';

type Phase = 'scene' | 'body';

interface Props {
  event: EventDef;
  onContinue: () => void;
}

export function EventModal({ event, onContinue }: Props) {
  const { palette } = useCareerPack();
  const playerName = useAppSelector((s) => s.profile.name);

  const vars: Record<string, string | undefined> = {
    playerName: playerName || 'you',
  };

  const hasScene = !!event.scene && event.scene.length > 0;
  const [phase, setPhase] = useState<Phase>(hasScene ? 'scene' : 'body');

  // Keyboard: Enter/Space dismisses on body phase.
  useEffect(() => {
    if (phase !== 'body') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, onContinue]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 20, 20, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: 'min(720px, 90vw)',
          minHeight: 360,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: palette.background,
          color: palette.ink,
          border: `2px solid ${palette.ink}`,
          padding: '40px 48px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {phase === 'scene' && event.scene && (
          <ScenePlayer
            scene={event.scene}
            vars={vars}
            onComplete={() => setPhase('body')}
          />
        )}
        {phase === 'body' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p
              style={{
                fontSize: 13,
                color: palette.inkMuted,
                margin: 0,
                marginBottom: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Event
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 500, margin: 0, marginBottom: 20, lineHeight: 1.3 }}>
              {interpolate(event.title, vars)}
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                margin: 0,
                marginBottom: 24,
                opacity: 0.9,
              }}
            >
              {interpolate(event.body, vars)}
            </p>
            <EffectChips effects={event.effects} />
            <button
              onClick={onContinue}
              style={{
                padding: '12px 32px',
                background: 'transparent',
                color: palette.ink,
                border: `1px solid ${palette.ink}`,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                alignSelf: 'flex-start',
              }}
            >
              OK
            </button>
            <p
              style={{
                fontSize: 11,
                color: palette.inkMuted,
                margin: 0,
                marginTop: 'auto',
                paddingTop: 16,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Press Enter or click OK
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
