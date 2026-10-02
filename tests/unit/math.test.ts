import { describe, expect, it } from 'vitest';
import { clampDpr, INTRO_SECONDS, introPosition, LIGHT_REST, lerp2, toUv } from '../../src/motion/math';

describe('lerp2', () => {
  it('moves a fraction of the way to the target', () => {
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 2 }, 0.5)).toEqual({ x: 0.5, y: 1 });
  });
  it('clamps the factor to [0, 1]', () => {
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 1 }, 2)).toEqual({ x: 1, y: 1 });
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 1 }, -1)).toEqual({ x: 0, y: 0 });
  });
});

describe('introPosition', () => {
  it('lasts about five seconds', () => {
    expect(INTRO_SECONDS).toBeGreaterThanOrEqual(4);
    expect(INTRO_SECONDS).toBeLessThanOrEqual(5);
  });
  it('moves during the entrance and stays inside [0.2, 0.8]', () => {
    const seen = new Set<string>();
    for (let s = 0; s <= INTRO_SECONDS; s += 0.25) {
      const p = introPosition(s);
      seen.add(`${p.x.toFixed(3)},${p.y.toFixed(3)}`);
      for (const v of [p.x, p.y]) {
        expect(v).toBeGreaterThanOrEqual(0.2);
        expect(v).toBeLessThanOrEqual(0.8);
      }
    }
    expect(seen.size).toBeGreaterThan(10);
  });
  it('comes to rest without a jump and then never moves again (WCAG 2.2.2)', () => {
    const near = introPosition(INTRO_SECONDS - 0.05);
    expect(Math.hypot(near.x - LIGHT_REST.x, near.y - LIGHT_REST.y)).toBeLessThan(0.005);
    for (const s of [INTRO_SECONDS, INTRO_SECONDS + 0.01, 60, 3600])
      expect(introPosition(s)).toEqual(LIGHT_REST);
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
