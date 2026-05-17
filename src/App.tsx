import { useState } from 'react';
import { RoomRenderer } from './game/rooms/RoomRenderer';
import { useCareerPack } from './game/content/useCareerPack';
import { roomConfigForMonth } from './game/content/roomConfigForMonth';
import { DevPanel } from './game/dev/DevPanel';
import { Hud } from './game/ui/Hud';
import { InitFlow } from './game/ui/InitFlow';
import { EndgameScreen } from './game/ui/EndgameScreen';
import { TitleScreen } from './game/ui/TitleScreen';
import { CurrentRoomProvider } from './game/ui/CurrentRoomContext';
import { useAppDispatch, useAppSelector } from './game/state/hooks';
import { resetProfile } from './game/state/slices/profileSlice';
import { resetProgress } from './game/state/slices/progressSlice';
import { resetStats } from './game/state/slices/statsSlice';
import { resetFlags } from './game/state/slices/flagsSlice';
import { resetHistory } from './game/state/slices/historySlice';
import { resetMeta } from './game/state/slices/metaSlice';
import { clearPersistedState } from './game/state/persistence';

export default function App() {
  const dispatch = useAppDispatch();
  const initComplete = useAppSelector((s) => s.profile.initComplete);
  const gameOver = useAppSelector((s) => s.progress.gameOver);
  // Title-screen gate (§16.0). Per-mount, not persisted — reloading the
  // page shows the title again. From here, "press any key" routes by
  // what's in localStorage: a resumable run → straight back to Game;
  // a fresh slate → into the InitFlow at the career picker. A finished
  // run (`gameOver === true`) gets wiped and routes to InitFlow — the
  // endgame screen has its own Begin Again button for in-session
  // review; bouncing the player straight to it from the title was
  // confusing ("I pressed start and got a summary").
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    if (gameOver) {
      dispatch(resetProfile());
      dispatch(resetProgress());
      dispatch(resetStats());
      dispatch(resetFlags());
      dispatch(resetHistory());
      dispatch(resetMeta());
      clearPersistedState();
    }
    setAcknowledged(true);
  };

  if (!acknowledged) {
    return (
      <PageFrame>
        <TitleScreen onAcknowledge={handleAcknowledge} />
      </PageFrame>
    );
  }

  // Init flow renders inside the same PageFrame as the title screen —
  // each phase's outer container is sized to the canvas frame so the
  // career picker / name entry / class picker / intro scene all sit in
  // the same visual envelope as the rest of the game.
  if (!initComplete) {
    return (
      <PageFrame>
        <InitFlow onComplete={() => undefined} />
      </PageFrame>
    );
  }

  return <Game />;
}

// Page-frame wrapper for non-Game top-level views (title screen + init
// flow). Mirrors the Game-wrapper chrome (dark app background +
// centered fixed-width content) so every non-Game screen sits in the
// same visual envelope as the rest of the app instead of floating on
// a stark cream page.
//
// Overrides `--canvas-display-width` for its subtree. The global value
// in global.css reserves 240px of viewport height for Game chrome
// (DevPanel + HUD + status bar + gaps + padding). Title screen and init
// flow have NONE of that — only the PageFrame's 48px of padding — so
// the global formula leaves them with a needlessly small canvas at
// short viewports (e.g. 915×412 → 287px wide instead of ~553px). The
// override uses an 80px chrome reserve (48px padding + 32px breathing
// room) so the canvas fills the available height.
function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#1a1a1a',
          color: '#eee',
          fontFamily: 'inherit',
          padding: '16px 0 32px 0',
          '--canvas-display-width':
            'min(100vw, 1000px, calc((100vh - 80px) * 5 / 3))',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function Game() {
  const { currentMonth } = useCareerPack();
  const gameOver = useAppSelector((s) => s.progress.gameOver);
  const config = roomConfigForMonth(currentMonth);

  return (
    <CurrentRoomProvider>
      <div
        data-component="Game"
        style={
          {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            fontFamily: 'inherit',
            background: '#1a1a1a',
            color: '#eee',
            gap: 16,
            // Top 16 (padding) + 16 (gap) = 32px before first element. Mirror
            // that below the last element with 32px bottom padding so the
            // canvas has matching breathing room.
            padding: '16px 0 32px 0',
            // Match the PageFrame override: trade the strict
            // "fit-everything-in-viewport" reserve (240px) for a lenient
            // 80px reserve, so wide-but-short viewports (e.g. 1326×504)
            // give the canvas the room they have horizontally instead of
            // collapsing it to 440px. Page may scroll vertically on
            // short viewports — accepted trade-off; the DevPanel and HUD
            // visually mismatching a tiny canvas was worse.
            '--canvas-display-width':
              'min(100vw, 1000px, calc((100vh - 80px) * 5 / 3))',
          } as React.CSSProperties
        }
      >
        {import.meta.env.DEV && <DevPanel />}
        <Hud />
        {gameOver ? <EndgameScreen /> : <RoomRenderer config={config} />}
      </div>
    </CurrentRoomProvider>
  );
}
