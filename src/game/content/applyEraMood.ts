import type { EraMood } from '../types/careerPack';

export function applyEraMood(hex: string, mood: EraMood): string {
  const { h, s, l } = hexToHsl(hex);
  const newH = ((h + mood.hueShift) % 360 + 360) % 360;
  const newS = clamp01(s * mood.saturation);
  const newL = clamp01(l * mood.lightness);
  return hslToHex(newH, newS, newL);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue: number;
  if (max === r) hue = ((g - b) / d) + (g < b ? 6 : 0);
  else if (max === g) hue = ((b - r) / d) + 2;
  else hue = ((r - g) / d) + 4;

  return { h: hue * 60, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1: number;
  let g1: number;
  let b1: number;
  if (h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}
