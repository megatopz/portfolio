export interface Vec2 {
  x: number;
  y: number;
}

export function lerp2(current: Vec2, target: Vec2, factor: number): Vec2 {
  const k = Math.min(Math.max(factor, 0), 1);
  return { x: current.x + (target.x - current.x) * k, y: current.y + (target.y - current.y) * k };
}

/** Slow Lissajous path inside [0.2, 0.8] used when there is no fine pointer. */
export function driftPosition(seconds: number): Vec2 {
  return { x: 0.5 + 0.3 * Math.sin(seconds * 0.23), y: 0.5 + 0.3 * Math.sin(seconds * 0.17 + 1.3) };
}

export function clampDpr(devicePixelRatio: number, max = 1.5): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(devicePixelRatio, max);
}

/** Converts a client pointer position to UV space (0..1, y up) for a given rect. */
export function toUv(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): Vec2 {
  const x = (clientX - rect.left) / rect.width;
  const y = 1 - (clientY - rect.top) / rect.height;
  return { x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) };
}
