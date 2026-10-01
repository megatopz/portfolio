import { toUv } from '../../motion/math';
import { createMotionPrefs, supportsWebGL } from '../../motion/prefs';
import type { LightScene } from './light-scene';

export type HeroLightState = 'idle' | 'running' | 'paused' | 'fallback' | 'off';

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  return image;
}

function whenIdle(callback: () => void): void {
  if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 2000 });
  else setTimeout(callback, 200);
}

/** Mounts the light effect on a [data-hero-light] element. Returns a cleanup function. */
export function mountHeroLight(root: HTMLElement): () => void {
  const canvas = root.querySelector('canvas');
  const textureUrl = root.dataset.texture;
  const setState = (state: HeroLightState) => {
    root.dataset.state = state;
  };
  if (canvas === null || textureUrl === undefined) {
    setState('fallback');
    return () => {};
  }

  const prefs = createMotionPrefs(window);
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let scene: LightScene | null = null;
  let visible = true;
  let disposed = false;

  const syncRunning = () => {
    if (scene === null) return;
    if (visible && document.visibilityState === 'visible') {
      scene.start();
      setState('running');
    } else {
      scene.stop();
      setState('paused');
    }
  };

  const teardownScene = () => {
    scene?.destroy();
    scene = null;
  };

  const onPointerMove = (event: PointerEvent) =>
    scene?.setPointer(toUv(event.clientX, event.clientY, canvas.getBoundingClientRect()));
  const onPointerLeave = () => scene?.setPointer(null);
  const onVisibility = () => syncRunning();
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    syncRunning();
  });

  const createScene = async () => {
    if (prefs.reduced()) return setState('off');
    if (!supportsWebGL(document)) return setState('fallback');
    try {
      const [{ createLightScene }, image] = await Promise.all([
        import('./light-scene'),
        loadImage(textureUrl),
      ]);
      if (disposed || prefs.reduced()) return;
      scene = createLightScene({
        canvas,
        image,
        onContextLost: () => {
          teardownScene();
          setState('fallback');
        },
      });
      syncRunning();
    } catch {
      teardownScene();
      setState('fallback');
    }
  };

  // One start at a time: a prefs change during the idle wait or the lazy import must not create
  // a second scene on the same canvas.
  let starting: Promise<void> | null = null;
  const start = (): Promise<void> => {
    if (disposed || scene !== null) return Promise.resolve();
    starting ??= createScene().finally(() => {
      starting = null;
    });
    return starting;
  };

  if (finePointer) {
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerleave', onPointerLeave);
  }
  document.addEventListener('visibilitychange', onVisibility);
  intersection.observe(root);
  const offPrefs = prefs.onChange((reduced) => {
    if (reduced) {
      teardownScene();
      setState('off');
    } else if (scene === null) {
      void start();
    }
  });

  whenIdle(() => void start());

  return () => {
    disposed = true;
    teardownScene();
    offPrefs();
    intersection.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', onPointerLeave);
  };
}
