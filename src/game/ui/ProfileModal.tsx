import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setProfile } from '../state/slices/profileSlice';
import { MAX_NAME_LENGTH, sanitizeName } from '../content/nameSanitize';

// Profile card (v2.0.7). Opened from the HUD top-left identity chip.
// Inline-edits the player name and dispatches `setProfile({ name })` — the
// rest of the app uses `{playerName}` interpolation already, so mid-game
// edits propagate through every decision / event / endgame string without
// any further wiring.
//
// Kid names (homeschool-parent pack only) are displayed for read but the
// edit buttons are disabled — kid-name editing requires the broader
// kid-name interpolation sprint (~74 'Hazel'/'Bram' occurrences across
// homeschool JSON files). Tracked separately as a GH issue.
//
// Mouse-driven by design per the user's "okay for now" — Esc still closes,
// but no full keyboard-nav focus trap (the ArcadeModal / NPCModal pattern).

interface Props {
  onClose: () => void;
}

// Display data for the kids section. Hardcoded "Hazel"/"Bram" mirrors the
// homeschool JSON content; when the kid-name interpolation sprint lands,
// these read from `profile.kidAName` / `profile.kidBName` instead.
const HOMESCHOOL_KIDS: ReadonlyArray<{ id: 'kidA' | 'kidB'; name: string }> = [
  { id: 'kidA', name: 'Hazel' },
  { id: 'kidB', name: 'Bram' },
];

export function ProfileModal({ onClose }: Props) {
  const { palette, pack } = useCareerPack();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.profile);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.name);

  const isHomeschool = pack.manifest.id === 'homeschool-parent';

  // Focus the input when entering edit mode; restore focus to the dialog
  // on exit so the next Esc closes the modal.
  useEffect(() => {
    if (editing) inputRef.current?.focus();
    else dialogRef.current?.focus();
  }, [editing]);

  // Esc closes the modal — but if an inline edit is open, Esc cancels the
  // edit first (matching standard inline-edit UX).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (editing) {
        setEditing(false);
        setDraft(profile.name);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, onClose, profile.name]);

  const sanitized = sanitizeName(draft);
  const canConfirm = sanitized.length > 0;

  const handleStartEdit = () => {
    setDraft(profile.name);
    setEditing(true);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    dispatch(setProfile({ name: sanitized }));
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(profile.name);
  };

  // ─── styles ────────────────────────────────────────────────────────────

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20, 20, 20, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  };

  const dialogStyle: CSSProperties = {
    width: 'min(440px, 88vw)',
    background: palette.background,
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    borderRadius: 6,
    padding: '24px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    fontFamily: 'inherit',
    animation: 'npc-modal-pop 200ms ease-out',
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 15,
  };

  const valueStyle: CSSProperties = {
    fontWeight: 600,
    color: palette.ink,
    flex: 1,
  };

  const editButtonStyle = (disabled: boolean): CSSProperties => ({
    padding: '4px 12px',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${disabled ? palette.surface : palette.ink}`,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.4 : 1,
    transition: 'background 120ms',
  });

  const sectionHeaderStyle: CSSProperties = {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: palette.inkMuted,
    marginTop: 4,
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    fontSize: 15,
    fontFamily: 'inherit',
    color: palette.ink,
    background: palette.background,
    border: `1px solid ${palette.ink}`,
    borderRadius: 4,
    minWidth: 0,
  };

  const closeRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 6,
  };

  const closeButtonStyle: CSSProperties = {
    padding: '8px 22px',
    background: 'transparent',
    color: palette.ink,
    border: `1px solid ${palette.ink}`,
    fontSize: 12,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 120ms',
  };

  return (
    <div
      data-component="ProfileModal"
      style={backdropStyle}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        data-region="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
        tabIndex={-1}
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={titleStyle}>Profile</h2>

        <div data-region="player" style={rowStyle}>
          {editing ? (
            <>
              <input
                ref={inputRef}
                data-region="name-input"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                maxLength={MAX_NAME_LENGTH * 2}
                style={inputStyle}
              />
              <button
                type="button"
                data-action="confirm-edit"
                onClick={handleConfirm}
                disabled={!canConfirm}
                style={editButtonStyle(!canConfirm)}
              >
                Save
              </button>
              <button
                type="button"
                data-action="cancel-edit"
                onClick={handleCancel}
                style={editButtonStyle(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span style={valueStyle}>{profile.name || '—'}</span>
              <button
                type="button"
                data-action="edit-player-name"
                onClick={handleStartEdit}
                style={editButtonStyle(false)}
              >
                Edit
              </button>
            </>
          )}
        </div>

        {isHomeschool && (
          <div data-region="kids">
            <p style={sectionHeaderStyle}>Children</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {HOMESCHOOL_KIDS.map((kid) => (
                <div key={kid.id} style={rowStyle} data-kid-id={kid.id}>
                  <span style={valueStyle}>{kid.name}</span>
                  <button
                    type="button"
                    data-action={`edit-${kid.id}-name`}
                    disabled
                    title="Coming soon — needs the kid-name interpolation sprint to update event/decision content too."
                    style={editButtonStyle(true)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={closeRowStyle}>
          <button
            type="button"
            data-action="close"
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = palette.surface)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
