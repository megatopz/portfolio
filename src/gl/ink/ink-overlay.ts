import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { clampDpr } from '../../motion/math';
import { tweenValue } from './ink-easing';
import { fragment, vertex } from './ink-shaders';

export type InkState = 'idle' | 'covering' | 'covered' | 'uncovering';

export interface InkOverlay {
  /** Animates coverage to `to` (1 = page hidden by ink). Resolves when done or superseded. */
  play(to: 0 | 1, direction: 1 | -1, durationMs: number): Promise<void>;
  setColor(rgb: [number, number, number]): void;
  destroy(): void;
}

export function createInkOverlay(canvas: HTMLCanvasElement): InkOverlay {
  const renderer = new Renderer({
    canvas,
    dpr: clampDpr(window.devicePixelRatio, 1),
    alpha: true,
    premultipliedAlpha: true,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    uniforms: {
      uProgress: { value: 0 },
      uDirection: { value: 1 },
      uSeed: { value: 0 },
      uColor: { value: [0.039, 0.039, 0.039] },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  let progress = 0;
  let raf = 0;
  let token = 0;

  const setState = (state: InkState) => {
    canvas.dataset.state = state;
  };
  setState('idle');

  const resize = () => renderer.setSize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', resize);
  resize();

  const draw = () => {
    program.uniforms.uProgress.value = progress;
    renderer.render({ scene: mesh });
  };

  return {
    play(to, direction, durationMs) {
      const id = ++token;
      cancelAnimationFrame(raf);
      const from = progress;
      program.uniforms.uDirection.value = direction;
      if (to === 1 && from === 0) program.uniforms.uSeed.value = Math.random() * 100;
      setState(to === 1 ? 'covering' : 'uncovering');
      const startedAt = performance.now();
      return new Promise<void>((resolve) => {
        const step = () => {
          if (id !== token) return resolve();
          progress = tweenValue(from, to, performance.now() - startedAt, durationMs);
          draw();
          if (progress !== to) {
            raf = requestAnimationFrame(step);
            return;
          }
          setState(to === 1 ? 'covered' : 'idle');
          resolve();
        };
        raf = requestAnimationFrame(step);
      });
    },
    setColor(rgb) {
      program.uniforms.uColor.value = rgb;
    },
    destroy() {
      token++;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
