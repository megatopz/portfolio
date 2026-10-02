import { describe, expect, it } from 'vitest';
import { fragment } from '../../src/gl/light/light-shaders';

describe('light fragment shader', () => {
  it('has a static grain: nothing in it depends on time (WCAG 2.2.2)', () => {
    expect(fragment).not.toMatch(/uTime/);
  });
});
