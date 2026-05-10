import { Room } from './game/rooms/Room';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      background: '#1a1a1a',
      color: '#eee',
      gap: 16,
    }}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Path to the Future</h1>
        <p style={{ margin: '4px 0', opacity: 0.7 }}>A career of choices</p>
      </header>
      <Room />
    </div>
  );
}
