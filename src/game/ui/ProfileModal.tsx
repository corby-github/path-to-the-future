import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useCareerPack } from '../content/useCareerPack';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setProfile } from '../state/slices/profileSlice';
import { MAX_NAME_LENGTH, sanitizeName } from '../content/nameSanitize';

// Profile card (v2.0.7). Opened from the HUD top-left identity chip.
// Inline-edits the player name (and, for packs with `manifest.requiresKidNames`,
// the kid names too — issue #76, v2.0.14). All edits dispatch
// `setProfile({ ... })`; the rest of the app interpolates `{playerName}` /
// `{kidA}` / `{kidB}` through pack content already, so mid-game edits
// propagate through every decision / event / endgame string without any
// further wiring.
//
// Mouse-driven by design per the user's "okay for now" — Esc still closes,
// but no full keyboard-nav focus trap (the ArcadeModal / NPCModal pattern).

interface Props {
  onClose: () => void;
}

// Which row is currently being edited inline. `null` = no edit in progress.
// All three editable fields share the same inline-edit machinery (draft +
// sanitize + Save/Cancel) — only the target slice key changes on Save.
type EditingField = null | 'name' | 'kidAName' | 'kidBName';

export function ProfileModal({ onClose }: Props) {
  const { palette, pack } = useCareerPack();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((s) => s.profile);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<EditingField>(null);
  const [draft, setDraft] = useState('');

  const showKids = (pack.manifest.requiresKidNames ?? 0) >= 2;

  // Focus the input when entering edit mode; restore focus to the dialog
  // on exit so the next Esc closes the modal.
  useEffect(() => {
    if (editing !== null) inputRef.current?.focus();
    else dialogRef.current?.focus();
  }, [editing]);

  // Esc closes the modal — but if an inline edit is open, Esc cancels the
  // edit first (matching standard inline-edit UX).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (editing !== null) {
        setEditing(null);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, onClose]);

  const sanitized = sanitizeName(draft);
  const canConfirm = sanitized.length > 0;

  const handleStartEdit = (field: Exclude<EditingField, null>) => {
    const current =
      field === 'name' ? profile.name : field === 'kidAName' ? profile.kidAName : profile.kidBName;
    setDraft(current);
    setEditing(field);
  };

  const handleConfirm = () => {
    if (!canConfirm || editing === null) return;
    dispatch(setProfile({ [editing]: sanitized }));
    setEditing(null);
  };

  const handleCancel = () => {
    setEditing(null);
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

        <NameRow
          dataRegion="player"
          dataAction="edit-player-name"
          dataInputRegion="name-input"
          value={profile.name}
          fallback="—"
          field="name"
          editing={editing}
          draft={draft}
          setDraft={setDraft}
          canConfirm={canConfirm}
          inputRef={inputRef}
          onStart={() => handleStartEdit('name')}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          rowStyle={rowStyle}
          valueStyle={valueStyle}
          inputStyle={inputStyle}
          editButtonStyle={editButtonStyle}
        />

        {showKids && (
          <div data-region="kids">
            <p style={sectionHeaderStyle}>Children</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              <NameRow
                dataRegion="kidA"
                dataAction="edit-kidA-name"
                dataInputRegion="kidA-input"
                value={profile.kidAName}
                fallback="—"
                field="kidAName"
                editing={editing}
                draft={draft}
                setDraft={setDraft}
                canConfirm={canConfirm}
                inputRef={inputRef}
                onStart={() => handleStartEdit('kidAName')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                rowStyle={rowStyle}
                valueStyle={valueStyle}
                inputStyle={inputStyle}
                editButtonStyle={editButtonStyle}
              />
              <NameRow
                dataRegion="kidB"
                dataAction="edit-kidB-name"
                dataInputRegion="kidB-input"
                value={profile.kidBName}
                fallback="—"
                field="kidBName"
                editing={editing}
                draft={draft}
                setDraft={setDraft}
                canConfirm={canConfirm}
                inputRef={inputRef}
                onStart={() => handleStartEdit('kidBName')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                rowStyle={rowStyle}
                valueStyle={valueStyle}
                inputStyle={inputStyle}
                editButtonStyle={editButtonStyle}
              />
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

// Single editable name row — reused for the player name and the two kid
// names (homeschool). All three share the inline-edit machinery; only the
// target slice key (`field`) differs on Save. Authored inline rather than
// extracted to its own module because it's tightly coupled to ProfileModal's
// editing/draft state (no other component needs this exact shape).
interface NameRowProps {
  dataRegion: string;
  dataAction: string;
  dataInputRegion: string;
  value: string;
  fallback: string;
  field: Exclude<EditingField, null>;
  editing: EditingField;
  draft: string;
  setDraft: (next: string) => void;
  canConfirm: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onStart: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  rowStyle: CSSProperties;
  valueStyle: CSSProperties;
  inputStyle: CSSProperties;
  editButtonStyle: (disabled: boolean) => CSSProperties;
}

function NameRow({
  dataRegion,
  dataAction,
  dataInputRegion,
  value,
  fallback,
  field,
  editing,
  draft,
  setDraft,
  canConfirm,
  inputRef,
  onStart,
  onConfirm,
  onCancel,
  rowStyle,
  valueStyle,
  inputStyle,
  editButtonStyle,
}: NameRowProps) {
  const isEditing = editing === field;
  return (
    <div data-region={dataRegion} style={rowStyle}>
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            data-region={dataInputRegion}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
              }
            }}
            maxLength={MAX_NAME_LENGTH * 2}
            style={inputStyle}
          />
          <button
            type="button"
            data-action={`${dataAction}-save`}
            onClick={onConfirm}
            disabled={!canConfirm}
            style={editButtonStyle(!canConfirm)}
          >
            Save
          </button>
          <button
            type="button"
            data-action={`${dataAction}-cancel`}
            onClick={onCancel}
            style={editButtonStyle(false)}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span style={valueStyle}>{value || fallback}</span>
          <button
            type="button"
            data-action={dataAction}
            onClick={onStart}
            disabled={editing !== null}
            style={editButtonStyle(editing !== null)}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}
