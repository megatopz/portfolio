import { describe, expect, it } from 'vitest';
import { lightDistance, lightSpaceScale } from '../../src/gl/light/light-space';

describe('lightSpaceScale', () => {
  it('landscape keeps the old formula: x in units of the height, y untouched', () => {
    expect(lightSpaceScale(1280, 900)).toEqual([1280 / 900, 1]);
  });

  it('portrait measures distance in units of the width, so the light shrinks', () => {
    expect(lightSpaceScale(390, 844)).toEqual([1, 844 / 390]);
  });

  it('square is [1, 1]', () => {
    expect(lightSpaceScale(500, 500)).toEqual([1, 1]);
  });
});

describe('lightDistance', () => {
  const legacy = (uv: [number, number], p: [number, number], w: number, h: number) =>
    Math.hypot((uv[0] - p[0]) * (w / h), uv[1] - p[1]);

  it('is identical to the previous formula in landscape and square', () => {
    for (const [w, h] of [
      [1280, 900],
      [1920, 600],
      [700, 700],
    ] as const) {
      expect(lightDistance([0.2, 0.9], [0.7, 0.4], w, h)).toBeCloseTo(
        legacy([0.2, 0.9], [0.7, 0.4], w, h),
        12,
      );
    }
  });

  it('in portrait the same UV offset is a larger distance (smaller light)', () => {
    const landscape = lightDistance([0.5, 0.5], [0.5, 0.8], 1000, 600);
    const portrait = lightDistance([0.5, 0.5], [0.5, 0.8], 390, 844);
    expect(portrait).toBeCloseTo(0.3 * (844 / 390), 12);
    expect(landscape).toBeCloseTo(0.3, 12);
  });

  it('is zero at the pointer', () => {
    expect(lightDistance([0.3, 0.3], [0.3, 0.3], 390, 844)).toBe(0);
  });
});
