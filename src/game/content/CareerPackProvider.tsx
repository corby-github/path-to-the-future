import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAppSelector } from '../state/hooks';
import { loadCareerPack } from './loader';
import { applyEraMood } from './applyEraMood';
import { CareerPackContext, type CareerPackContextValue } from './careerPackContext';
import type { CareerPack, EraMood, Palette } from '../types/careerPack';

const NEUTRAL_MOOD: EraMood = { saturation: 1, lightness: 1, hueShift: 0 };

interface Props {
  children: ReactNode;
}

function fallbackScreen(message: string, isError: boolean) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: isError ? '#e88' : '#888',
        fontFamily: 'inherit',
        fontSize: 14,
        letterSpacing: '0.04em',
      }}
    >
      {message}
    </div>
  );
}

// Used before the user reaches the career picker — gives the pre-init UI a
// pack to render against (palette, intro, etc.). Once the user picks, the
// profile's careerPack id is set and the provider re-fetches.
const DEFAULT_PACK_ID = 'software-engineering';

export function CareerPackProvider({ children }: Props) {
  const profilePackId = useAppSelector((s) => s.profile.careerPack);
  const packId = profilePackId || DEFAULT_PACK_ID;
  const currentMonthId = useAppSelector((s) => s.progress.currentMonth);
  const viewingMonthId = useAppSelector((s) => s.progress.viewingMonth);
  // Effective month = what's being rendered. Falls back to currentMonth
  // when viewingMonth is null (normal play). When viewingMonth is set
  // (replay), it overrides — but the live currentMonth still lives in
  // Redux for things that need to know the player's actual progress.
  const effectiveMonthId = viewingMonthId ?? currentMonthId;

  const [pack, setPack] = useState<CareerPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCareerPack(packId)
      .then((loaded) => {
        if (cancelled) return;
        setPack(loaded);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load career pack');
      });
    return () => {
      cancelled = true;
    };
  }, [packId]);

  // If the loaded pack is for a different career than the current packId,
  // treat it as still loading until the new fetch resolves.
  const isStale = pack !== null && pack.manifest.id !== packId;

  const value = useMemo<CareerPackContextValue | null>(() => {
    if (!pack || isStale) return null;

    const currentMonth =
      pack.months.find((m) => m.id === effectiveMonthId) ?? pack.months[0];
    const liveMonth =
      pack.months.find((m) => m.id === currentMonthId) ?? pack.months[0];

    // Era mood resolves against the SHOWN month (so replay rooms show the
    // 2020 pandemic mood when you walk back to 2020, even if the live
    // month is 2027).
    const mood =
      pack.manifest.eras[currentMonth.era] ??
      pack.manifest.eras.default ??
      NEUTRAL_MOOD;

    const base = pack.manifest.palette;
    const palette: Palette = {
      background: applyEraMood(base.background, mood),
      ink: applyEraMood(base.ink, mood),
      inkMuted: applyEraMood(base.inkMuted, mood),
      surface: applyEraMood(base.surface, mood),
      accent: applyEraMood(base.accent, mood),
      positive: applyEraMood(base.positive, mood),
      player: applyEraMood(base.player, mood),
      playerInk: applyEraMood(base.playerInk, mood),
      npcAdult: applyEraMood(base.npcAdult, mood),
      npcAdultInk: applyEraMood(base.npcAdultInk, mood),
      npcChild: applyEraMood(base.npcChild, mood),
      npcChildInk: applyEraMood(base.npcChildInk, mood),
    };

    const isReplay = viewingMonthId !== null;

    return { pack, currentMonth, palette, isReplay, liveMonth };
  }, [pack, isStale, effectiveMonthId, currentMonthId, viewingMonthId]);

  if (!value) {
    if (error && !pack) return fallbackScreen(`Failed to load career pack: ${error}`, true);
    return fallbackScreen('Loading…', false);
  }

  return <CareerPackContext.Provider value={value}>{children}</CareerPackContext.Provider>;
}
