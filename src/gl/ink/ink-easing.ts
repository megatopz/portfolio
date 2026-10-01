/** easeInOutCubic on t ∈ [0, 1] */
export function easeInOut(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Progress value at `elapsed` ms for a tween from `from` to `to` lasting `duration` ms. */
export function tweenValue(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0) return to;
  return from + (to - from) * easeInOut(elapsed / duration);
}
