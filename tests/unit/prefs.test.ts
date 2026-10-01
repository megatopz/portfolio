import { describe, expect, it, vi } from 'vitest';
import { createMotionPrefs, supportsWebGL } from '../../src/motion/prefs';

function fakeHost(initial: boolean, forcedColors = false) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const query = {
    matches: initial,
    addEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.delete(l),
  };
  return {
    host: {
      matchMedia: (q: string) =>
        (q.includes('forced-colors') ? { matches: forcedColors } : query) as unknown as MediaQueryList,
    },
    emit(matches: boolean) {
      query.matches = matches;
      for (const l of listeners) l({ matches });
    },
    count: () => listeners.size,
  };
}

describe('createMotionPrefs', () => {
  it('reports the current preference and notifies changes', () => {
    const fake = fakeHost(false);
    const prefs = createMotionPrefs(fake.host);
    const listener = vi.fn();
    const off = prefs.onChange(listener);
    expect(prefs.reduced()).toBe(false);
    fake.emit(true);
    expect(listener).toHaveBeenCalledWith(true);
    expect(prefs.reduced()).toBe(true);
    off();
    expect(fake.count()).toBe(0);
  });
});

describe('forced colours', () => {
  it('counts as reduced motion', () => {
    const fake = fakeHost(false, true);
    expect(createMotionPrefs(fake.host).reduced()).toBe(true);
  });
  it('keeps effects off when reduced motion is turned off but forced colours stay on', () => {
    const fake = fakeHost(true, true);
    const prefs = createMotionPrefs(fake.host);
    const listener = vi.fn();
    prefs.onChange(listener);
    fake.emit(false);
    expect(listener).toHaveBeenCalledWith(true);
  });
});

describe('supportsWebGL', () => {
  const docWith = (ctx: unknown) => ({
    createElement: () => ({ getContext: () => ctx }) as unknown as HTMLCanvasElement,
  });
  it('is true when a context is returned', () => {
    expect(supportsWebGL(docWith({}))).toBe(true);
  });
  it('is false when no context is available', () => {
    expect(supportsWebGL(docWith(null))).toBe(false);
  });
  it('is false when getContext throws', () => {
    const doc = {
      createElement: () =>
        ({
          getContext: () => {
            throw new Error('blocked');
          },
        }) as unknown as HTMLCanvasElement,
    };
    expect(supportsWebGL(doc)).toBe(false);
  });
});
