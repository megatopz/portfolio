import { tiltToUv, type TiltReference, type Vec2 } from './math';

type PermissionState = 'granted' | 'denied' | 'default';
type OrientationReading = { beta: number | null; gamma: number | null };

/** The slice of `window` the tilt control needs; injectable so it can be tested without a browser. */
export interface TiltHost {
  addEventListener(type: 'deviceorientation', listener: (event: OrientationReading) => void): void;
  removeEventListener(type: 'deviceorientation', listener: (event: OrientationReading) => void): void;
  DeviceOrientationEvent?: { requestPermission?: () => Promise<PermissionState> };
  screen?: { orientation?: { angle: number } };
  /** Legacy screen angle, for Safari before 16.4 (no screen.orientation). */
  orientation?: number;
}

export interface TiltControl {
  /** Listens to the sensor when allowed. The first reading after each start is the reference pose. */
  start(): void;
  /** Removes the listener and hands the light back to the drift. */
  stop(): void;
  /** True while a tap is needed to ask for permission (iOS), until it has been asked once. */
  needsGesture(): boolean;
  /** Asks for permission; call it synchronously from a tap handler. Asks at most once. */
  requestFromGesture(): Promise<void>;
  /** True while readings are steering the light. */
  active(): boolean;
}

/** Without a reading this soon after subscribing, assume there is no sensor and keep the drift. */
const SILENCE_MS = 1000;

/**
 * Phone tilt as a light source. `onTilt` receives the target UV for each reading, or null when
 * tilt stops steering (stop, or the sensor stays silent).
 */
export function createTiltControl(host: TiltHost, onTilt: (uv: Vec2 | null) => void): TiltControl {
  const api = host.DeviceOrientationEvent;
  const askable = typeof api?.requestPermission === 'function';
  let permission: 'none' | 'ask' | 'asking' | 'granted' | 'denied' = !api
    ? 'none'
    : askable
      ? 'ask'
      : 'granted';
  let wanted = false;
  let listening = false;
  let reference: TiltReference | null = null;
  let referenceAngle = 0;
  let silence: ReturnType<typeof setTimeout> | undefined;

  const angle = () => host.screen?.orientation?.angle ?? host.orientation ?? 0;

  const onReading = (event: OrientationReading) => {
    const { beta, gamma } = event;
    if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) return;
    clearTimeout(silence);
    // Recalibrate when the screen turns: the way the phone is held changes with it.
    if (reference === null || angle() !== referenceAngle) {
      reference = { beta, gamma };
      referenceAngle = angle();
    }
    onTilt(tiltToUv(beta, gamma, reference, referenceAngle));
  };

  const unsubscribe = () => {
    clearTimeout(silence);
    if (!listening) return;
    listening = false;
    host.removeEventListener('deviceorientation', onReading);
    if (reference !== null) onTilt(null);
    reference = null;
  };

  const subscribe = () => {
    if (listening || !wanted || permission !== 'granted') return;
    listening = true;
    reference = null;
    host.addEventListener('deviceorientation', onReading);
    silence = setTimeout(() => {
      if (reference === null) unsubscribe();
    }, SILENCE_MS);
  };

  return {
    start() {
      wanted = true;
      subscribe();
    },
    stop() {
      wanted = false;
      unsubscribe();
    },
    needsGesture: () => permission === 'ask',
    requestFromGesture() {
      if (permission !== 'ask' || !api?.requestPermission) return Promise.resolve();
      permission = 'asking';
      // iOS only shows the prompt when requestPermission runs inside the gesture, before any await.
      return api.requestPermission().then(
        (result) => {
          permission = result === 'granted' ? 'granted' : 'denied';
          subscribe();
        },
        () => {
          permission = 'denied';
        },
      );
    },
    active: () => listening && reference !== null,
  };
}
