import type { Bounds } from './types/geometry';

// Virtual coordinate system per design doc §11.
// All rooms are 1000×600 internally; display scales via SVG viewBox.
export const ROOM_VIEWBOX = {
  width: 1000,
  height: 600,
} as const;

export const ROOM_PADDING = 20;

export const PLAYER_RADIUS = 14;

export const ROOM_BOUNDS: Bounds = {
  minX: ROOM_PADDING,
  minY: ROOM_PADDING,
  maxX: ROOM_VIEWBOX.width - ROOM_PADDING,
  maxY: ROOM_VIEWBOX.height - ROOM_PADDING,
};
