import { useCallback, useEffect, useMemo, useState } from 'react';

// §8b "Modal Presentation for NPCs & Objects."
//
// Renders `text` one character at a time at a fixed cadence. Punctuation
// inserts natural rhythm pauses without explicit markup. `[[pause:N]]` tags
// hold for N ms in-line for dramatic beats.
//
// Skip-to-end: any key/tap press while revealing completes the text. A
// second press, after full reveal, fires `onAdvance` (parent decides what
// "advance" means — close, open options, etc.).
//
// Reset semantics: callers that need to play a NEW string should pass a
// fresh `key` so the component remounts. Without that, changing `text`
// mid-reveal leaves stale `visible` state.

interface Props {
  text: string;
  // Default per §8b. Settable globally via manifest.json `typewriterSpeedMs`
  // and overridable per modal — for now we just accept the prop.
  speedMs?: number;
  onComplete?: () => void;
  // Called when the user presses key/clicks AFTER reveal is complete. The
  // parent decides what "advance" means (close modal, show options, etc.).
  onAdvance?: () => void;
  // When true, a press during reveal completes the text instead of
  // advancing past it. Defaults true per §8b.
  skipOnInteract?: boolean;
}

interface ParsedToken {
  // For 'char', value is one character to emit; for 'pause', value is ms to hold.
  kind: 'char' | 'pause';
  value: string | number;
}

// Per-char extra hold per §8b's punctuation pause rules.
function punctuationHoldMs(ch: string): number {
  if (ch === ',') return 60;
  if (ch === '.' || ch === '!' || ch === '?') return 180;
  if (ch === '—') return 120;
  return 0;
}

// Parses `[[pause:N]]` tags out of the source string into a flat token list
// of chars + pauses. Tags are stripped from output.
function parse(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  const re = /\[\[pause:(\d+)\]\]/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    for (let i = cursor; i < m.index; i++) {
      tokens.push({ kind: 'char', value: text[i] });
    }
    tokens.push({ kind: 'pause', value: parseInt(m[1], 10) });
    cursor = m.index + m[0].length;
  }
  for (let i = cursor; i < text.length; i++) {
    tokens.push({ kind: 'char', value: text[i] });
  }
  return tokens;
}

export function TypewriterText({
  text,
  speedMs = 30,
  onComplete,
  onAdvance,
  skipOnInteract = true,
}: Props) {
  const tokens = useMemo(() => parse(text), [text]);
  const totalChars = useMemo(
    () => tokens.filter((t) => t.kind === 'char').length,
    [tokens],
  );

  const [visible, setVisible] = useState(0);

  // Derived completion — once all visible chars are emitted (or empty text),
  // the reveal is complete. Computed during render so we avoid the
  // setState-in-effect lint rule (no separate `complete` state to sync).
  const complete = totalChars === 0 || visible >= totalChars;

  // Notify parent on the transition to complete. Runs once per emission
  // cycle; only invokes the callback — no internal setState here, so it's
  // an external-systems sync per the React docs.
  useEffect(() => {
    if (complete) onComplete?.();
  }, [complete, onComplete]);

  // Emit characters with the appropriate delay between chars (speedMs +
  // punctuation hold) and explicit pauses inline. State updates happen
  // inside the setTimeout callback, so they're asynchronous relative to
  // the effect body and don't trigger the cascading-render lint rule.
  useEffect(() => {
    if (totalChars === 0) return;
    let cancelled = false;
    let timer: number | null = null;
    let tokenIdx = 0;
    let charsEmitted = 0;

    const step = () => {
      if (cancelled) return;
      while (tokenIdx < tokens.length) {
        const tok = tokens[tokenIdx];
        if (tok.kind === 'pause') {
          tokenIdx++;
          timer = window.setTimeout(step, tok.value as number);
          return;
        }
        charsEmitted++;
        setVisible(charsEmitted);
        const ch = tok.value as string;
        tokenIdx++;
        if (charsEmitted >= totalChars) return;
        const delay = speedMs + punctuationHoldMs(ch);
        timer = window.setTimeout(step, delay);
        return;
      }
    };

    // Kick off after a tiny delay so the modal fade-in feels in front of
    // the reveal.
    timer = window.setTimeout(step, 60);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [tokens, totalChars, speedMs]);

  const handleInteract = useCallback(() => {
    if (!complete && skipOnInteract) {
      // Skip-to-end: jump visible to total. Derived `complete` flips true.
      setVisible(totalChars);
      return;
    }
    if (complete) {
      onAdvance?.();
    }
  }, [complete, totalChars, skipOnInteract, onAdvance]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'e' && e.key !== 'E') return;
      e.preventDefault();
      handleInteract();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleInteract]);

  // Render the visible-prefix of the source text. Reconstructed from the
  // visible char count over the tokens list (pause tokens don't emit chars).
  let display = '';
  let shown = 0;
  for (const tok of tokens) {
    if (shown >= visible) break;
    if (tok.kind === 'char') {
      display += tok.value;
      shown++;
    }
  }

  return (
    <span onClick={handleInteract} style={{ cursor: complete ? 'pointer' : 'default' }}>
      {display}
      {!complete && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            marginLeft: 1,
            animation: 'typewriter-caret-blink 530ms steps(1) infinite',
          }}
        >
          ▌
        </span>
      )}
    </span>
  );
}
