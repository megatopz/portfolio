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

export interface TiltReference {
  beta: number;
  gamma: number;
}

/** Degrees of tilt from the reference that reach the edge of the light's zone. */
const TILT_RANGE = 30;
/** Half-width of the zone the tilt covers: 0.5 ± 0.35 = 0.15..0.85. */
const TILT_REACH = 0.35;

/** Wraps an angle difference to (-180, 180] so 170° → -170° counts as 20°, not 340°. */
function angleDelta(angle: number, reference: number): number {
  const d = (((angle - reference) % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

/**
 * Maps device orientation (deviceorientation beta/gamma, degrees) to the light's UV position,
 * relative to a reference pose so it works at whatever angle the phone is held. The light rolls
 * towards the edge that is lowered, like a ball. `screenAngle` is screen.orientation.angle.
 */
export function tiltToUv(beta: number, gamma: number, reference: TiltReference, screenAngle: number): Vec2 {
  const centre = { x: 0.5, y: 0.5 };
  if (![beta, gamma, reference.beta, reference.gamma].every(Number.isFinite)) return centre;
  // Tilt in the device's own frame, x right and y up: right edge down (gamma +) → +x,
  // top edge down (beta −) → +y.
  const dx = angleDelta(gamma, reference.gamma);
  const dy = -angleDelta(beta, reference.beta);
  // Screen orientation is always a multiple of 90°; snap it so the rotation stays exact.
  const quarter = Number.isFinite(screenAngle) ? ((Math.round(screenAngle / 90) % 4) + 4) % 4 : 0;
  const [sx, sy] = [
    [dx, dy],
    [-dy, dx],
    [-dx, -dy],
    [dy, -dx],
  ][quarter] as [number, number];
  const axis = (value: number) => 0.5 + Math.min(Math.max(value / TILT_RANGE, -1), 1) * TILT_REACH;
  return { x: axis(sx), y: axis(sy) };
}
