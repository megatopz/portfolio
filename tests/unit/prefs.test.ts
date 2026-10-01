import { describe, expect, it, vi } from 'vitest';
import { createMotionPrefs, supportsWebGL } from '../../src/motion/prefs';

type Listener = (e: { matches: boolean }) => void;

function fakeQuery(matches: boolean) {
  const listeners = new Set<Listener>();
  return {
    matches,
    listeners,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
    emit(next: boolean) {
      this.matches = next;
      for (const l of listeners) l({ matches: next });
    },
  };
}

function fakeHost(initial: boolean, forcedColors = false) {
  const reduced = fakeQuery(initial);
  const forced = fakeQuery(forcedColors);
  return {
    host: {
      matchMedia: (q: string) =>
        (q.includes('forced-colors') ? forced : reduced) as unknown as MediaQueryList,
    },
    emit: (matches: boolean) => reduced.emit(matches),
    emitForced: (matches: boolean) => forced.emit(matches),
    count: () => reduced.listeners.size + forced.listeners.size,
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
  it('notifies when forced colours are toggled at runtime and unsubscribes from both queries', () => {
    const fake = fakeHost(false, false);
    const prefs = createMotionPrefs(fake.host);
    const listener = vi.fn();
    const off = prefs.onChange(listener);
    fake.emitForced(true);
    expect(listener).toHaveBeenLastCalledWith(true);
    fake.emitForced(false);
    expect(listener).toHaveBeenLastCalledWith(false);
    off();
    expect(fake.count()).toBe(0);
    fake.emitForced(true);
    expect(listener).toHaveBeenCalledTimes(2);
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
  it('releases the probe context so it does not count against the browser limit', () => {
    const loseContext = vi.fn();
    const ctx = { getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null) };
    expect(supportsWebGL(docWith(ctx))).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });
});
