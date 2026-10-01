import { describe, expect, it } from 'vitest';
import { tiltToUv } from '../../src/motion/math';

const ref = { beta: 40, gamma: 0 };
const close = (actual: { x: number; y: number }, x: number, y: number) => {
  expect(actual.x).toBeCloseTo(x, 6);
  expect(actual.y).toBeCloseTo(y, 6);
};

describe('tiltToUv', () => {
  it('puts the light in the centre at the reference position', () => {
    close(tiltToUv(40, 0, ref, 0), 0.5, 0.5);
    close(tiltToUv(-12, 25, { beta: -12, gamma: 25 }, 0), 0.5, 0.5);
  });

  it('maps about ±30° of tilt to the 0.15–0.85 zone in portrait', () => {
    // Right edge down (gamma +) rolls the light right; top edge away (beta −) rolls it up.
    close(tiltToUv(40, 30, ref, 0), 0.85, 0.5);
    close(tiltToUv(40, -30, ref, 0), 0.15, 0.5);
    close(tiltToUv(10, 0, ref, 0), 0.5, 0.85);
    close(tiltToUv(70, 0, ref, 0), 0.5, 0.15);
    close(tiltToUv(25, 15, ref, 0), 0.675, 0.675);
  });

  it('clamps tilts beyond ±30° to the edges of the zone', () => {
    close(tiltToUv(40, 80, ref, 0), 0.85, 0.5);
    close(tiltToUv(-50, -89, ref, 0), 0.15, 0.85);
  });

  it('rotates the axes for landscape and upside-down screens', () => {
    // Landscape primary (device turned counter-clockwise): the device's right edge is now the top.
    close(tiltToUv(40, 30, ref, 90), 0.5, 0.85);
    close(tiltToUv(10, 0, ref, 90), 0.15, 0.5);
    // Landscape secondary (clockwise).
    close(tiltToUv(40, 30, ref, 270), 0.5, 0.15);
    close(tiltToUv(10, 0, ref, 270), 0.85, 0.5);
    // Upside down portrait mirrors both axes.
    close(tiltToUv(40, 30, ref, 180), 0.15, 0.5);
    // Negative or wrapped angles mean the same orientation.
    close(tiltToUv(40, 30, ref, -90), 0.5, 0.15);
    close(tiltToUv(40, 30, ref, 450), 0.5, 0.85);
  });

  it('takes the short way round when beta wraps at ±180°', () => {
    close(tiltToUv(-170, 0, { beta: 170, gamma: 0 }, 0), 0.5, 0.5 - (20 / 30) * 0.35);
  });

  it('falls back to the centre for missing or non-finite readings', () => {
    close(tiltToUv(Number.NaN, 10, ref, 0), 0.5, 0.5);
    close(tiltToUv(40, Number.POSITIVE_INFINITY, ref, 0), 0.5, 0.5);
    close(tiltToUv(40, 30, { beta: Number.NaN, gamma: 0 }, 0), 0.5, 0.5);
    // A bogus screen angle is treated as portrait.
    close(tiltToUv(40, 30, ref, Number.NaN), 0.85, 0.5);
  });
});
