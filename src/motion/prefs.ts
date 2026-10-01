type MatchMediaHost = { matchMedia(query: string): MediaQueryList };

const REDUCED = '(prefers-reduced-motion: reduce)';
const FORCED_COLORS = '(forced-colors: active)';

export interface MotionPrefs {
  reduced(): boolean;
  onChange(listener: (reduced: boolean) => void): () => void;
}

/**
 * Effects are off when the user asks for reduced motion or uses forced colours
 * (spec: forced-colors without grain or effects).
 */
export function createMotionPrefs(host: MatchMediaHost): MotionPrefs {
  const query = host.matchMedia(REDUCED);
  const forced = host.matchMedia(FORCED_COLORS);
  return {
    reduced: () => query.matches || forced.matches,
    onChange(listener) {
      const handler = () => listener(query.matches || forced.matches);
      query.addEventListener('change', handler);
      return () => query.removeEventListener('change', handler);
    },
  };
}

type CanvasFactory = { createElement(tag: 'canvas'): HTMLCanvasElement };

export function supportsWebGL(doc: CanvasFactory): boolean {
  try {
    const canvas = doc.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
