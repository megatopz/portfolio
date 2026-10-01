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
      // Both can change at runtime (e.g. a Windows contrast theme toggles forced colours).
      query.addEventListener('change', handler);
      forced.addEventListener('change', handler);
      return () => {
        query.removeEventListener('change', handler);
        forced.removeEventListener('change', handler);
      };
    },
  };
}

type CanvasFactory = { createElement(tag: 'canvas'): HTMLCanvasElement };

export function supportsWebGL(doc: CanvasFactory): boolean {
  try {
    const canvas = doc.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    // Release the probe now: browsers cap live WebGL contexts and evict the oldest one.
    gl?.getExtension?.('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}
