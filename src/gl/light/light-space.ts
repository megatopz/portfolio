/**
 * Per-axis multipliers that turn UV offsets into light-distance units, normalised by the canvas's
 * SHORTER side. Landscape: [w/h, 1] (distance in heights, as before). Portrait: [1, h/w] (in widths).
 * Mirrors `aspect` in light-shaders.ts.
 */
export function lightSpaceScale(width: number, height: number): [number, number] {
  const shorter = Math.min(width, height);
  return [width / shorter, height / shorter];
}

/** Distance between two UV points in light units; mirrors `distance(vUv * s, uPointer * s)` in the shader. */
export function lightDistance(
  uv: readonly [number, number],
  pointer: readonly [number, number],
  width: number,
  height: number,
): number {
  const [sx, sy] = lightSpaceScale(width, height);
  return Math.hypot((uv[0] - pointer[0]) * sx, (uv[1] - pointer[1]) * sy);
}
