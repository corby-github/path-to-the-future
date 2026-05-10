import { RoomRenderer } from './game/rooms/RoomRenderer';
import { useAppSelector } from './game/state/hooks';
import type { RoomConfig } from './game/types/room';

// Day-4 placeholder routing: hard-codes a few room types so all four
// renderers are exercised. Day 5 replaces this with the career-pack
// content loader (months.json + the room generator).
function deriveRoomConfig(monthId: number): RoomConfig {
  if (monthId === 1) {
    return {
      monthId,
      roomType: 'narrative',
      title: 'The world is about to go quiet.',
      body: 'It is January 2020. You are starting your career. The next ten years are yours to shape — one month at a time.',
      continueLabel: 'Begin',
    };
  }
  if (monthId === 3) {
    return { monthId, roomType: 'minigame', variant: 'code-review' };
  }
  if (monthId === 5) {
    return {
      monthId,
      roomType: 'consequence',
      title: 'Something significant just happened.',
      body: 'The shape of your year shifts. A meeting goes long. A decision compounds. You feel the year turn.',
    };
  }
  return { monthId, roomType: 'decision' };
}

export default function App() {
  const monthId = useAppSelector((s) => s.progress.currentMonth);
  const config = deriveRoomConfig(monthId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        background: '#1a1a1a',
        color: '#eee',
        gap: 16,
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Path to the Future</h1>
        <p style={{ margin: '4px 0', opacity: 0.7 }}>A career of choices</p>
      </header>
      <RoomRenderer config={config} />
    </div>
  );
}
