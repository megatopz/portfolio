import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { clampDpr, INTRO_SECONDS, introPosition, lerp2, LIGHT_REST, type Vec2 } from '../../motion/math';
import type { LightParams } from './light-params';
import { fragment, vertex } from './light-shaders';

export interface LightScene {
  /** Pointer in UV space, or null to hand the light back to its entrance or resting place. */
  setPointer(uv: Vec2 | null): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

export interface LightSceneOptions {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  onContextLost(): void;
  /** Exposure far from and at the light, and its radius (resolved by the caller). */
  light: LightParams;
}

export function createLightScene({
  canvas,
  image,
  onContextLost,
  light: { min, max, radius },
}: LightSceneOptions): LightScene {
  const renderer = new Renderer({
    canvas,
    dpr: clampDpr(window.devicePixelRatio),
    alpha: false,
    antialias: false,
  });
  const gl = renderer.gl;
  // OGL pins the canvas CSS size to pixels; clear it so the stylesheet (100% of the figure) drives the size.
  const releaseCssSize = () => {
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');
  };
  releaseCssSize();
  const texture = new Texture(gl, {
    image,
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uImage: { value: texture },
      uPointer: { value: [LIGHT_REST.x, LIGHT_REST.y] },
      uResolution: { value: [1, 1] },
      uImageSize: { value: [image.naturalWidth, image.naturalHeight] },
      uIntensity: { value: 0 },
      uExposureMin: { value: min },
      uExposureMax: { value: max },
      uRadius: { value: radius },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  let raf = 0;
  let running = false;
  let target: Vec2 | null = null;
  let current: Vec2 = { ...LIGHT_REST };
  let intensity = 0;
  const startedAt = performance.now();

  // Frames are only drawn while something changes: the loop sleeps once the light has settled
  // and wakes on input or a resize (which clears the canvas).
  const wake = () => {
    if (running && raf === 0) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight);
    releaseCssSize();
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const handleLost = (event: Event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    onContextLost();
  };
  canvas.addEventListener('webglcontextlost', handleLost);

  function frame() {
    raf = 0;
    const seconds = (performance.now() - startedAt) / 1000;
    const goal = target ?? introPosition(seconds);
    current = lerp2(current, goal, 0.08);
    // Snap the last sub-pixel of the easing so the light truly stops.
    const settled = Math.hypot(goal.x - current.x, goal.y - current.y) < 1e-4;
    if (settled) current = { ...goal };
    intensity = Math.min(1, intensity + 0.02);
    program.uniforms.uPointer.value = [current.x, current.y];
    program.uniforms.uIntensity.value = intensity;
    renderer.render({ scene: mesh });
    const still = settled && intensity === 1 && (target !== null || seconds >= INTRO_SECONDS);
    if (!still) wake();
  }

  return {
    setPointer(uv) {
      target = uv;
      wake();
    },
    start() {
      if (running) return;
      running = true;
      wake();
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', handleLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
