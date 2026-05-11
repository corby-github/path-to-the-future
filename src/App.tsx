import { RoomRenderer } from './game/rooms/RoomRenderer';
import { useCareerPack } from './game/content/useCareerPack';
import { roomConfigForMonth } from './game/content/roomConfigForMonth';
import { DevPanel } from './game/dev/DevPanel';
import { Hud } from './game/ui/Hud';
import { InitFlow } from './game/ui/InitFlow';
import { useAppSelector } from './game/state/hooks';

export default function App() {
  const initComplete = useAppSelector((s) => s.profile.initComplete);

  // Init flow renders its own full-screen cream surface; the dark game wrapper
  // is only mounted after the player completes career → name → class → intro.
  if (!initComplete) {
    return <InitFlow onComplete={() => undefined} />;
  }

  return <Game />;
}

function Game() {
  const { currentMonth } = useCareerPack();
  const config = roomConfigForMonth(currentMonth);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        background: '#1a1a1a',
        color: '#eee',
        gap: 16,
        padding: '16px 0',
      }}
    >
      <Hud />
      {import.meta.env.DEV && <DevPanel />}
      <RoomRenderer config={config} />
    </div>
  );
}
