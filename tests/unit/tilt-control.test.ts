import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTiltControl, type TiltHost } from '../../src/motion/tilt-control';
import type { Vec2 } from '../../src/motion/math';

type Reading = { beta: number | null; gamma: number | null };
type Handler = (event: Reading) => void;

/** A sessionStorage stand-in; pass the same one to two hosts to model two mounts in one session. */
function fakeStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

function fakeHost(
  options: {
    api?: 'none' | 'open' | 'granted' | 'denied' | 'throws';
    angle?: number;
    storage?: ReturnType<typeof fakeStorage> | 'throws';
    legacyOrientation?: number;
  } = {},
) {
  const { api = 'open' } = options;
  const handlers = new Set<Handler>();
  const requestPermission = vi.fn(() =>
    api === 'throws'
      ? Promise.reject(new Error('not a gesture'))
      : Promise.resolve(api as 'granted' | 'denied'),
  );
  const host = {
    addEventListener: vi.fn((_type: 'deviceorientation', handler: Handler) => handlers.add(handler)),
    removeEventListener: vi.fn((_type: 'deviceorientation', handler: Handler) => handlers.delete(handler)),
    screen: options.legacyOrientation === undefined ? { orientation: { angle: options.angle ?? 0 } } : {},
    ...(options.legacyOrientation === undefined ? {} : { orientation: options.legacyOrientation }),
    ...(api === 'none' ? {} : { DeviceOrientationEvent: api === 'open' ? {} : { requestPermission } }),
  };
  const storage = options.storage ?? fakeStorage();
  Object.defineProperty(host, 'sessionStorage', {
    get() {
      // Browsers throw on access when storage is blocked (e.g. cookies disabled).
      if (storage === 'throws') throw new DOMException('blocked', 'SecurityError');
      return storage;
    },
  });
  return {
    host: host as unknown as TiltHost,
    requestPermission,
    listeners: () => handlers.size,
    emit(reading: Reading) {
      for (const handler of [...handlers]) handler(reading);
    },
    rotate(angle: number) {
      if (host.screen.orientation) host.screen.orientation.angle = angle;
    },
  };
}

function setup(fake: ReturnType<typeof fakeHost>) {
  const seen: Array<Vec2 | null> = [];
  const control = createTiltControl(fake.host, (uv) => seen.push(uv));
  return { control, seen };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('createTiltControl without a permission API (Android)', () => {
  it('subscribes on start, calibrates on the first reading and maps the following ones', () => {
    const fake = fakeHost({ api: 'open' });
    const { control, seen } = setup(fake);
    expect(control.needsGesture()).toBe(false);
    control.start();
    expect(fake.listeners()).toBe(1);
    fake.emit({ beta: 40, gamma: 5 });
    fake.emit({ beta: 40, gamma: 35 });
    expect(seen[0]).toEqual({ x: 0.5, y: 0.5 });
    expect(seen[1]?.x).toBeCloseTo(0.85);
    expect(control.active()).toBe(true);
  });

  it('ignores readings without values (desktop browsers send one null event)', () => {
    const fake = fakeHost({ api: 'open' });
    const { control, seen } = setup(fake);
    control.start();
    fake.emit({ beta: null, gamma: null });
    expect(seen).toEqual([]);
    expect(control.active()).toBe(false);
  });

  it('gives up and keeps the drift when no reading arrives within about a second', () => {
    const fake = fakeHost({ api: 'open' });
    const { control, seen } = setup(fake);
    control.start();
    vi.advanceTimersByTime(1_100);
    expect(fake.listeners()).toBe(0);
    expect(seen).toEqual([]);
    // Pausing and resuming tries again: the sensor may just have been slow.
    control.stop();
    control.start();
    expect(fake.listeners()).toBe(1);
  });

  it('keeps listening past the timeout once readings flow', () => {
    const fake = fakeHost({ api: 'open' });
    const { control } = setup(fake);
    control.start();
    fake.emit({ beta: 10, gamma: 0 });
    vi.advanceTimersByTime(5_000);
    expect(fake.listeners()).toBe(1);
  });

  it('removes the listener on stop, hands control back to the drift and recalibrates on the next start', () => {
    const fake = fakeHost({ api: 'open' });
    const { control, seen } = setup(fake);
    control.start();
    fake.emit({ beta: 40, gamma: 0 });
    control.stop();
    expect(fake.listeners()).toBe(0);
    expect(seen.at(-1)).toBeNull();
    expect(control.active()).toBe(false);
    control.start();
    fake.emit({ beta: 0, gamma: 20 });
    expect(seen.at(-1)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('recalibrates when the screen orientation changes', () => {
    const fake = fakeHost({ api: 'open' });
    const { control, seen } = setup(fake);
    control.start();
    fake.emit({ beta: 40, gamma: 0 });
    fake.rotate(90);
    fake.emit({ beta: 5, gamma: 60 });
    expect(seen.at(-1)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('start is idempotent', () => {
    const fake = fakeHost({ api: 'open' });
    const { control } = setup(fake);
    control.start();
    control.start();
    expect(fake.host.addEventListener).toHaveBeenCalledTimes(1);
  });
});

describe('createTiltControl with a permission API', () => {
  it('steers without a tap when readings flow anyway (Chrome exposes requestPermission too)', () => {
    const fake = fakeHost({ api: 'granted' });
    const { control, seen } = setup(fake);
    control.start();
    expect(fake.listeners()).toBe(1);
    fake.emit({ beta: 30, gamma: 0 });
    expect(seen).toEqual([{ x: 0.5, y: 0.5 }]);
    expect(control.needsGesture()).toBe(false);
    expect(fake.requestPermission).not.toHaveBeenCalled();
  });

  it('on iPhone stays silent until permission is granted from a tap, then steers', async () => {
    const fake = fakeHost({ api: 'granted' });
    const { control, seen } = setup(fake);
    control.start();
    expect(control.needsGesture()).toBe(true);
    vi.advanceTimersByTime(1_100);
    expect(fake.listeners()).toBe(0);
    expect(control.needsGesture()).toBe(true);
    await control.requestFromGesture();
    expect(fake.requestPermission).toHaveBeenCalledOnce();
    expect(control.needsGesture()).toBe(false);
    expect(fake.listeners()).toBe(1);
    fake.emit({ beta: 30, gamma: 0 });
    expect(seen).toEqual([{ x: 0.5, y: 0.5 }]);
  });

  it('restarts the silence window when permission is granted while still listening', async () => {
    const fake = fakeHost({ api: 'granted' });
    const { control } = setup(fake);
    control.start();
    vi.advanceTimersByTime(800);
    await control.requestFromGesture();
    vi.advanceTimersByTime(800);
    expect(fake.listeners()).toBe(1);
  });

  it('calls requestPermission synchronously inside the gesture handler', () => {
    const fake = fakeHost({ api: 'granted' });
    const { control } = setup(fake);
    void control.requestFromGesture();
    expect(fake.requestPermission).toHaveBeenCalledOnce();
  });

  it('subscribes on the next start when permission was granted while stopped', async () => {
    const fake = fakeHost({ api: 'granted' });
    const { control } = setup(fake);
    await control.requestFromGesture();
    expect(fake.listeners()).toBe(0);
    control.start();
    expect(fake.listeners()).toBe(1);
  });

  it('keeps the drift and never asks again when permission is denied', async () => {
    const fake = fakeHost({ api: 'denied' });
    const { control } = setup(fake);
    control.start();
    await control.requestFromGesture();
    await control.requestFromGesture();
    expect(fake.requestPermission).toHaveBeenCalledOnce();
    expect(control.needsGesture()).toBe(false);
    expect(fake.listeners()).toBe(0);
    control.stop();
    control.start();
    expect(fake.listeners()).toBe(0);
  });

  it('treats a rejected request as denied', async () => {
    const fake = fakeHost({ api: 'throws' });
    const { control } = setup(fake);
    control.start();
    await control.requestFromGesture();
    expect(control.needsGesture()).toBe(false);
    expect(fake.listeners()).toBe(0);
  });

  it('does not subscribe if it was stopped while the prompt was open', async () => {
    const fake = fakeHost({ api: 'granted' });
    const { control } = setup(fake);
    control.start();
    const pending = control.requestFromGesture();
    control.stop();
    await pending;
    expect(fake.listeners()).toBe(0);
  });
});

describe('a denial lasts the whole session', () => {
  it('a later mount neither asks again nor waits for a tap', async () => {
    const storage = fakeStorage();
    const first = fakeHost({ api: 'denied', storage });
    await setup(first).control.requestFromGesture();
    const second = fakeHost({ api: 'denied', storage });
    const { control } = setup(second);
    control.start();
    expect(control.needsGesture()).toBe(false);
    await control.requestFromGesture();
    expect(second.requestPermission).not.toHaveBeenCalled();
    expect(second.listeners()).toBe(0);
  });

  it('is remembered in memory when sessionStorage throws', async () => {
    await setup(fakeHost({ api: 'denied', storage: 'throws' })).control.requestFromGesture();
    const second = fakeHost({ api: 'denied', storage: 'throws' });
    const { control } = setup(second);
    expect(control.needsGesture()).toBe(false);
    await control.requestFromGesture();
    expect(second.requestPermission).not.toHaveBeenCalled();
  });

  it('a fresh session still asks', () => {
    const { control } = setup(fakeHost({ api: 'granted' }));
    expect(control.needsGesture()).toBe(true);
  });
});

describe('legacy screen angle', () => {
  it('uses window.orientation when screen.orientation is missing (-90 means 270)', () => {
    const fake = fakeHost({ api: 'open', legacyOrientation: -90 });
    const { control, seen } = setup(fake);
    control.start();
    fake.emit({ beta: 40, gamma: 0 });
    fake.emit({ beta: 40, gamma: 30 });
    // Landscape secondary: the device's right edge is the bottom of the screen.
    expect(seen.at(-1)?.x).toBeCloseTo(0.5);
    expect(seen.at(-1)?.y).toBeCloseTo(0.15);
  });
});

describe('createTiltControl without the API at all', () => {
  it('never subscribes nor asks', async () => {
    const fake = fakeHost({ api: 'none' });
    const { control } = setup(fake);
    control.start();
    expect(control.needsGesture()).toBe(false);
    await control.requestFromGesture();
    expect(fake.host.addEventListener).not.toHaveBeenCalled();
  });
});
