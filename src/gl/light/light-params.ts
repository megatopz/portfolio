/** Exposure far from the light (min), at its centre (max), and the light's radius in UV units. */
export interface LightParams {
  min: number;
  max: number;
  radius: number;
}

export type LightInput = Partial<Record<keyof LightParams, string | number | undefined>>;

/** Chosen by the owner at the 2026-10-01 gate: a brighter floor so the photo never disappears. */
export const LIGHT_DEFAULTS: LightParams = { min: 0.6, max: 1.35, radius: 0.3 };

/** Anything outside these is a typo, not an experiment, and is ignored. */
const BOUNDS: Record<keyof LightParams, readonly [number, number]> = {
  min: [0, 1.5],
  max: [0.5, 3],
  radius: [0.05, 2],
};

function parse(value: string | number | undefined, [low, high]: readonly [number, number]): number | null {
  const n = typeof value === 'string' ? (value.trim() === '' ? Number.NaN : Number(value)) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= low && n <= high ? n : null;
}

/** Fills in the defaults for missing or invalid values; brightness overrides with min > max are dropped. */
export function resolveLightParams(input: LightInput): LightParams {
  const min = parse(input.min, BOUNDS.min) ?? LIGHT_DEFAULTS.min;
  const max = parse(input.max, BOUNDS.max) ?? LIGHT_DEFAULTS.max;
  const radius = parse(input.radius, BOUNDS.radius) ?? LIGHT_DEFAULTS.radius;
  return min <= max ? { min, max, radius } : { ...LIGHT_DEFAULTS, radius };
}
