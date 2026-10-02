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
  /** Remembers a denial across remounts (HeroLight mounts again on every page load). */
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem'>;
}

export interface TiltControl {
  /** Listens to the sensor when allowed. The first reading after each start is the reference pose. */
  start(): void;
  /** Removes the listener and hands the light back to its resting place. */
  stop(): void;
  /** True while a tap is needed to ask for permission (iOS), until it has been asked once. */
  needsGesture(): boolean;
  /** Asks for permission; call it synchronously from a tap handler. Asks at most once. */
  requestFromGesture(): Promise<void>;
  /** True while readings are steering the light. */
  active(): boolean;
  /**
   * True once the sensor has stayed silent while permission can still be asked for (iPhone before a
   * tap), until permission is granted or denied: the time to show a "tap to move the light" hint.
   */
  awaitingTap(): boolean;
}

/** Without a reading this soon after subscribing, assume there is no sensor (or no permission yet). */
const SILENCE_MS = 1000;

/**
 * "If denied, do not ask again in this session": the outcome outlives one mount. sessionStorage
 * also covers full reloads; when it is blocked (access throws), module scope still covers the
 * client-side navigations of this document. A grant needs no record: within the document the
 * sensor keeps sending readings, which the control takes as permission.
 */
const DENIED_KEY = 'hero-light:tilt-denied';
let deniedInMemory = false;

function wasDenied(host: TiltHost): boolean {
  try {
    const storage = host.sessionStorage;
    if (storage) return storage.getItem(DENIED_KEY) === '1';
  } catch {
    // Blocked storage: fall back to memory.
  }
  return deniedInMemory;
}

function rememberDenial(host: TiltHost): void {
  try {
    const storage = host.sessionStorage;
    if (storage) return storage.setItem(DENIED_KEY, '1');
  } catch {
    // Blocked storage (or quota): fall back to memory.
  }
  deniedInMemory = true;
}

/**
 * Phone tilt as a light source. `onTilt` receives the target UV for each reading, or null when
 * tilt stops steering. It listens as soon as it starts; when a requestPermission API exists and no
 * reading arrives (iOS before a grant), `needsGesture()` stays true so a tap can ask, once.
 * `onAwaitingTap` is told each time `awaitingTap()` changes.
 */
export function createTiltControl(
  host: TiltHost,
  onTilt: (uv: Vec2 | null) => void,
  onAwaitingTap: (awaiting: boolean) => void = () => {},
): TiltControl {
  const api = host.DeviceOrientationEvent;
  const askable = typeof api?.requestPermission === 'function';
  let permission: 'none' | 'ask' | 'asking' | 'granted' | 'denied' = !api
    ? 'none'
    : !askable
      ? 'granted'
      : wasDenied(host)
        ? 'denied'
        : 'ask';
  let wanted = false;
  let listening = false;
  let reference: TiltReference | null = null;
  let referenceAngle = 0;
  let silence: ReturnType<typeof setTimeout> | undefined;
  let awaiting = false;

  const setAwaiting = (value: boolean) => {
    if (value === awaiting) return;
    awaiting = value;
    onAwaitingTap(value);
  };

  const angle = () => host.screen?.orientation?.angle ?? host.orientation ?? 0;

  const onReading = (event: OrientationReading) => {
    const { beta, gamma } = event;
    if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) return;
    clearTimeout(silence);
    // Readings without a prompt (Chrome also exposes requestPermission): nothing to ask for.
    if (permission === 'ask') permission = 'granted';
    setAwaiting(false);
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
    // Listen even before an iOS grant: no readings arrive until then, and the silence timer gives up.
    if (listening || !wanted || permission === 'none' || permission === 'denied') return;
    listening = true;
    reference = null;
    host.addEventListener('deviceorientation', onReading);
    silence = setTimeout(() => {
      if (reference !== null) return;
      unsubscribe();
      // Silent although it could ask: on iPhone, readings only start after a tap grants permission.
      if (permission === 'ask') setAwaiting(true);
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
          if (permission === 'denied') rememberDenial(host);
          setAwaiting(false);
          // Resubscribe so a granted sensor gets a fresh silence window; a denial just stops.
          unsubscribe();
          subscribe();
        },
        () => {
          permission = 'denied';
          rememberDenial(host);
          setAwaiting(false);
          unsubscribe();
        },
      );
    },
    active: () => listening && reference !== null,
    awaitingTap: () => awaiting,
  };
}
