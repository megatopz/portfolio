import { describe, expect, it } from 'vitest';
import { LIGHT_DEFAULTS, resolveLightParams } from '../../src/gl/light/light-params';

describe('resolveLightParams', () => {
  it('uses the owner-approved defaults when nothing is given', () => {
    expect(LIGHT_DEFAULTS).toEqual({ min: 0.75, max: 1.35, radius: 0.65 });
    expect(resolveLightParams({})).toEqual(LIGHT_DEFAULTS);
  });

  it('accepts in-range numbers and numeric strings', () => {
    expect(resolveLightParams({ min: '0.6', max: 1.8, radius: '0.4' })).toEqual({
      min: 0.6,
      max: 1.8,
      radius: 0.4,
    });
    expect(resolveLightParams({ min: '0', max: '3', radius: '2' })).toEqual({ min: 0, max: 3, radius: 2 });
  });

  it('ignores values that are not numbers or fall outside sane bounds', () => {
    expect(resolveLightParams({ min: 'abc', max: '', radius: ' ' })).toEqual(LIGHT_DEFAULTS);
    expect(resolveLightParams({ min: '-0.1', max: '3.5', radius: '0.01' })).toEqual(LIGHT_DEFAULTS);
    expect(resolveLightParams({ min: 'Infinity', max: Number.NaN, radius: '5' })).toEqual(LIGHT_DEFAULTS);
    expect(resolveLightParams({ radius: '0.3' })).toEqual({ ...LIGHT_DEFAULTS, radius: 0.3 });
  });

  it('ignores the brightness overrides when they would make the edge brighter than the centre', () => {
    expect(resolveLightParams({ min: '1.2', max: '0.9', radius: '0.5' })).toEqual({
      ...LIGHT_DEFAULTS,
      radius: 0.5,
    });
    // Against the defaults too: min 1.5 alone is above the default max 1.35.
    expect(resolveLightParams({ min: '1.5' })).toEqual(LIGHT_DEFAULTS);
    expect(resolveLightParams({ min: '1', max: '1' })).toEqual({ ...LIGHT_DEFAULTS, min: 1, max: 1 });
  });
});
