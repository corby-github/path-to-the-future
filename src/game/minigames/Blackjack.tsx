import { useCallback, useEffect, useState } from 'react';
import { ROOM_VIEWBOX } from '../coordinates';
import { monthLabel } from '../calendar';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch } from '../state/hooks';
import { applyStatEffect } from '../state/slices/statsSlice';
import type { Palette } from '../types/careerPack';

interface Props {
  monthId: number;
  onComplete: () => void;
}

type Suit = '♠' | '♥' | '♦' | '♣';
interface Card {
  rank: string;
  suit: Suit;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const STAKE = 200;

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return parseInt(card.rank, 10);
}

function handTotal(hand: Card[]): number {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

interface DealState {
  deck: Card[];
  player: Card[];
  dealer: Card[];
}

function initialDeal(): DealState {
  const deck = makeDeck();
  const player = [deck.pop()!, deck.pop()!];
  const dealer = [deck.pop()!, deck.pop()!];
  return { deck, player, dealer };
}

const WIN_FLAVORS = [
  'You won $200. You tipped the dealer twenty. He nodded — they always nod.',
  'Twenty-one. You walked out before the next hand. That was the discipline.',
  'You won on a soft eighteen. The pit boss didn’t look up.',
];
const LOSE_FLAVORS = [
  'You lost $200. You bought a coffee on the way out, just to make the night feel like something.',
  'You doubled down in your head on a sixteen. The dealer drew a five.',
  'You busted on a third hit. You said “one more hand” once, then went up to the room.',
];
const PUSH_FLAVORS = [
  'A push. The chips stay where they are. You stand up while you’re even.',
  'Tied at nineteen. You took it as a sign.',
];

function pickFlavor(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function CardFace({ card, palette, hidden }: { card?: Card; palette: Palette; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div
        style={{
          width: 56,
          height: 80,
          background: palette.surface,
          border: `1px solid ${palette.ink}`,
          borderRadius: 4,
          opacity: 0.85,
        }}
      />
    );
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      style={{
        width: 56,
        height: 80,
        background: palette.background,
        border: `1px solid ${palette.ink}`,
        borderRadius: 4,
        padding: '6px 8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: "'SF Mono', Menlo, monospace",
        fontWeight: 600,
        color: isRed ? palette.accent : palette.ink,
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{card.rank}</span>
      <span style={{ alignSelf: 'flex-end', fontSize: 20, lineHeight: 1 }}>{card.suit}</span>
    </div>
  );
}

export function Blackjack({ monthId, onComplete }: Props) {
  const { palette } = useCareerPack();
  const dispatch = useAppDispatch();

  // Single state object for deck/player/dealer so the initial deal can be
  // a lazy-state initializer (no effect needed).
  const [deal, setDeal] = useState<DealState>(initialDeal);
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');
  const [result, setResult] = useState<'win' | 'lose' | 'push' | null>(null);
  const [flavor, setFlavor] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<'hit' | 'stand'>('hit');

  const resolveAgainstDealer = useCallback((finalPlayer: Card[], finalDealer: Card[]) => {
    const dt = handTotal(finalDealer);
    const pt = handTotal(finalPlayer);
    let res: 'win' | 'lose' | 'push';
    if (pt > 21) res = 'lose';
    else if (dt > 21) res = 'win';
    else if (pt > dt) res = 'win';
    else if (pt < dt) res = 'lose';
    else res = 'push';
    setResult(res);
    setFlavor(
      pickFlavor(res === 'win' ? WIN_FLAVORS : res === 'lose' ? LOSE_FLAVORS : PUSH_FLAVORS),
    );
    setPhase('result');
  }, []);

  const handleHit = useCallback(() => {
    if (phase !== 'playing' || deal.deck.length === 0) return;
    const nextDeck = [...deal.deck];
    const drawn = nextDeck.pop()!;
    const nextPlayer = [...deal.player, drawn];
    setDeal({ ...deal, deck: nextDeck, player: nextPlayer });
    if (handTotal(nextPlayer) > 21) {
      resolveAgainstDealer(nextPlayer, deal.dealer);
    }
  }, [phase, deal, resolveAgainstDealer]);

  const handleStand = useCallback(() => {
    if (phase !== 'playing') return;
    // Dealer plays out their hand inline: hit until 17.
    const nextDeck = [...deal.deck];
    const nextDealer = [...deal.dealer];
    while (handTotal(nextDealer) < 17 && nextDeck.length > 0) {
      nextDealer.push(nextDeck.pop()!);
    }
    setDeal({ ...deal, deck: nextDeck, dealer: nextDealer });
    resolveAgainstDealer(deal.player, nextDealer);
  }, [phase, deal, resolveAgainstDealer]);

  const handleContinue = useCallback(() => {
    if (result === 'win') {
      dispatch(applyStatEffect({ stat: 'savings', op: '+', magnitude: STAKE }));
    } else if (result === 'lose') {
      dispatch(applyStatEffect({ stat: 'savings', op: '-', magnitude: STAKE }));
    }
    onComplete();
  }, [result, dispatch, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'playing') {
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setSelectedAction('hit');
          handleHit();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setSelectedAction('stand');
          handleStand();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedAction('hit');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedAction('stand');
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selectedAction === 'hit') handleHit();
          else handleStand();
        }
      } else if (phase === 'result') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContinue();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, selectedAction, handleHit, handleStand, handleContinue]);

  const playerTotal = handTotal(deal.player);
  const dealerHidden = phase === 'playing';
  const dealerShowTotal =
    dealerHidden && deal.dealer.length > 0 ? cardValue(deal.dealer[0]) : handTotal(deal.dealer);

  return (
    <div
      style={{
        width: 'var(--canvas-display-width)',
        aspectRatio: `${ROOM_VIEWBOX.width} / ${ROOM_VIEWBOX.height}`,
        background: palette.background,
        color: palette.ink,
        border: `1px solid ${palette.surface}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 48px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: '0.1em',
          color: palette.inkMuted,
          margin: 0,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {monthLabel(monthId)} · Blackjack · ${STAKE} stake
      </p>

      {phase === 'result' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: '0.1em',
              color: palette.inkMuted,
              margin: 0,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            {result === 'win' ? 'You won' : result === 'lose' ? 'You lost' : 'Push'}
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: 0, marginBottom: 40, opacity: 0.85 }}>
            {flavor}
          </p>
          <button
            onClick={handleContinue}
            style={{
              padding: '10px 28px',
              background: 'transparent',
              color: palette.ink,
              border: `1px solid ${palette.ink}`,
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: palette.inkMuted,
                  margin: 0,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                Dealer{deal.dealer.length > 0 ? ` · ${dealerShowTotal}${dealerHidden ? '+' : ''}` : ''}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {deal.dealer.map((c, i) => (
                  <CardFace key={i} card={c} palette={palette} hidden={dealerHidden && i === 1} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: palette.inkMuted,
                  margin: 0,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                You{deal.player.length > 0 ? ` · ${playerTotal}` : ''}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {deal.player.map((c, i) => (
                  <CardFace key={i} card={c} palette={palette} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button
              onClick={() => { setSelectedAction('hit'); handleHit(); }}
              onMouseEnter={() => setSelectedAction('hit')}
              style={{
                padding: '10px 24px',
                background: selectedAction === 'hit' ? palette.surface : 'transparent',
                color: palette.ink,
                border: `1px solid ${palette.ink}`,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 120ms',
              }}
            >
              Hit (H)
            </button>
            <button
              onClick={() => { setSelectedAction('stand'); handleStand(); }}
              onMouseEnter={() => setSelectedAction('stand')}
              style={{
                padding: '10px 24px',
                background: selectedAction === 'stand' ? palette.surface : 'transparent',
                color: palette.ink,
                border: `1px solid ${palette.ink}`,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 120ms',
              }}
            >
              Stand (S)
            </button>
          </div>
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: palette.inkMuted,
              textAlign: 'center',
              margin: 0,
              marginTop: 8,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            ← → to choose · Enter / Space to confirm · H / S direct
          </p>
        </>
      )}
    </div>
  );
}
