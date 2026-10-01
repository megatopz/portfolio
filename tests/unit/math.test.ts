import { describe, expect, it } from 'vitest';
import { clampDpr, driftPosition, lerp2, toUv } from '../../src/motion/math';

describe('lerp2', () => {
  it('moves a fraction of the way to the target', () => {
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 2 }, 0.5)).toEqual({ x: 0.5, y: 1 });
  });
  it('clamps the factor to [0, 1]', () => {
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 1 }, 2)).toEqual({ x: 1, y: 1 });
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 1 }, -1)).toEqual({ x: 0, y: 0 });
  });
});

describe('driftPosition', () => {
  it('stays inside [0.2, 0.8] over a long period', () => {
    for (let s = 0; s < 600; s += 0.5) {
      const p = driftPosition(s);
      expect(p.x).toBeGreaterThanOrEqual(0.2);
      expect(p.x).toBeLessThanOrEqual(0.8);
      expect(p.y).toBeGreaterThanOrEqual(0.2);
      expect(p.y).toBeLessThanOrEqual(0.8);
    }
  });
});

describe('clampDpr', () => {
  it('caps at 1.5 and guards invalid values', () => {
    expect(clampDpr(3)).toBe(1.5);
    expect(clampDpr(1)).toBe(1);
    expect(clampDpr(0)).toBe(1);
    expect(clampDpr(Number.NaN)).toBe(1);
  });
});

describe('toUv', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  it('maps the rect to 0..1 with y pointing up', () => {
    expect(toUv(100, 150, rect)).toEqual({ x: 0, y: 0 });
    expect(toUv(300, 50, rect)).toEqual({ x: 1, y: 1 });
  });
  it('clamps positions outside the rect', () => {
    expect(toUv(0, 0, rect)).toEqual({ x: 0, y: 1 });
  });
});
