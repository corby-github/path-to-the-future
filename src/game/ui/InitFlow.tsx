import { useCallback, type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { useCareerPack } from '../content/useCareerPack';
import { setProfile } from '../state/slices/profileSlice';
import { setStats } from '../state/slices/statsSlice';
import { addXp, setClassTier } from '../state/slices/progressSlice';
import { trackEvent } from '../analytics/track';
import { CareerPicker } from './CareerPicker';
import { NameEntry } from './NameEntry';
import { KidNamesEntry } from './KidNamesEntry';
import { ClassPicker } from './ClassPicker';
import { IntroScene } from './IntroScene';
import type { CareerPack } from '../types/careerPack';
import type { AppDispatch } from '../state/store';

// Init-flow orchestrator per §16. Walks the player through:
//   1. Career picker — sets profile.careerPack
//   2. Name entry — sets profile.name
//   2a. Kid names — only for packs with `manifest.requiresKidNames` (issue
//       #76). Homeschool prompts for kidA / kidB names here.
//   3. Class picker — sets profile.entryClass + seeds starting stats / XP
//   4. Intro scene — pre-game narrative from manifest.intro
//
// After step 4, sets profile.initComplete = true, which (in App.tsx) flips
// the gate from this component to the game proper. Intermediate state
// persists, so reloading mid-init resumes at the last completed step.

type Phase = 'career' | 'name' | 'kid-names' | 'class' | 'intro';

interface Props {
  onComplete: () => void;
}

export function InitFlow({ onComplete }: Props) {
  const dispatch = useAppDispatch();
  const { pack } = useCareerPack();
  const profile = useAppSelector((s) => s.profile);

  const requiresKidNames = (pack.manifest.requiresKidNames ?? 0) >= 2;
  const phase = currentPhase(profile, requiresKidNames);

  const handleCareerPicked = useCallback(
    (careerId: string) => {
      dispatch(setProfile({ careerPack: careerId }));
    },
    [dispatch],
  );

  const handleNameSubmitted = useCallback(
    (name: string) => {
      dispatch(setProfile({ name }));
    },
    [dispatch],
  );

  const handleKidNamesSubmitted = useCallback(
    (kidAName: string, kidBName: string) => {
      dispatch(setProfile({ kidAName, kidBName, kidNamesSet: true }));
    },
    [dispatch],
  );

  const handleClassPicked = useCallback(
    (classId: string) => {
      applyStartingState(dispatch, pack, classId);
      dispatch(
        setProfile({ entryClass: classId, createdAt: Date.now() }),
      );
    },
    [dispatch, pack],
  );

  const handleIntroComplete = useCallback(() => {
    trackEvent('game_started', {
      career: profile.careerPack,
      class: profile.entryClass,
    });
    dispatch(setProfile({ initComplete: true }));
    onComplete();
  }, [dispatch, onComplete, profile.careerPack, profile.entryClass]);

  return (
    <div data-component="InitFlow" data-phase={phase}>
      {phase === 'career' && <CareerPicker onSelect={handleCareerPicked} />}
      {phase === 'name' && <NameEntry onSubmit={handleNameSubmitted} />}
      {phase === 'kid-names' && (
        <KidNamesEntry
          initialKidAName={profile.kidAName}
          initialKidBName={profile.kidBName}
          onSubmit={handleKidNamesSubmitted}
        />
      )}
      {phase === 'class' && <ClassPicker onSelect={handleClassPicked} />}
      {phase === 'intro' && <IntroScene onComplete={handleIntroComplete} />}
      {import.meta.env.DEV && (
        <DevSkipButton
          onSkip={() => {
            applyStartingState(dispatch, pack, 'novice');
            dispatch(
              setProfile({
                careerPack: 'software-engineering',
                name: 'Dev',
                entryClass: 'novice',
                createdAt: Date.now(),
                initComplete: true,
                // Dev skip targets SWE which doesn't require kid names, but
                // flip the flag anyway so a later switch can't trip a stale
                // unfinished-init phase.
                kidNamesSet: true,
              }),
            );
            trackEvent('game_started', {
              career: 'software-engineering',
              class: 'novice',
            });
            onComplete();
          }}
        />
      )}
    </div>
  );
}

// ---- phase resolver ----

function currentPhase(
  profile: {
    careerPack: string;
    name: string;
    entryClass: string;
    kidNamesSet: boolean;
  },
  requiresKidNames: boolean,
): Phase {
  if (!profile.careerPack) return 'career';
  if (!profile.name) return 'name';
  if (requiresKidNames && !profile.kidNamesSet) return 'kid-names';
  if (!profile.entryClass) return 'class';
  return 'intro';
}

// ---- starting-state seeding ----
//
// Reads the manifest's entryClass entry for the picked classId and dispatches:
//   - setStats(startingStats) to apply burnout/savings/network/etc.
//   - addXp(startingXp) and setClassTier(classId) to seed XP + tier.
//
// If the classId isn't in the manifest, this is a no-op (shouldn't happen —
// the picker enforces playability before reaching here).
function applyStartingState(
  dispatch: AppDispatch,
  pack: CareerPack,
  classId: string,
): void {
  const entry = pack.manifest.entryClasses[classId];
  if (!entry) return;

  dispatch(setStats(entry.startingStats));
  dispatch(addXp(entry.startingXp));
  dispatch(setClassTier(classId));
}

// ---- dev skip button ----

interface DevSkipButtonProps {
  onSkip: () => void;
}

function DevSkipButton({ onSkip }: DevSkipButtonProps) {
  const style: CSSProperties = {
    position: 'fixed',
    bottom: 16,
    right: 16,
    fontSize: 11,
    fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
    color: '#e88',
    border: '1px dashed #555',
    background: 'rgba(20, 20, 20, 0.85)',
    padding: '6px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    letterSpacing: '0.04em',
    zIndex: 1000,
  };
  return (
    <button
      type="button"
      data-action="dev-skip-to-game"
      style={style}
      onClick={onSkip}
    >
      DEV · skip to game
    </button>
  );
}
