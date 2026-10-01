import { describe, expect, it } from 'vitest';
import { easeInOut, tweenValue } from '../../src/gl/ink/ink-easing';

describe('easeInOut', () => {
  it('starts at 0, ends at 1 and is symmetric around 0.5', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(0.25) + easeInOut(0.75)).toBeCloseTo(1);
  });
  it('clamps outside [0, 1]', () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});

describe('tweenValue', () => {
  it('interpolates between from and to', () => {
    expect(tweenValue(1, 0, 0, 250)).toBe(1);
    expect(tweenValue(1, 0, 250, 250)).toBe(0);
    expect(tweenValue(0, 1, 125, 250)).toBeCloseTo(0.5);
  });
  it('jumps to the end when duration is not positive', () => {
    expect(tweenValue(0, 1, 0, 0)).toBe(1);
  });
});
