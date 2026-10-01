import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { clampDpr, driftPosition, lerp2, type Vec2 } from '../../motion/math';
import type { LightParams } from './light-params';
import { fragment, vertex } from './light-shaders';

export interface LightScene {
  /** Pointer in UV space, or null to let the light drift on its own. */
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
      uPointer: { value: [0.5, 0.6] },
      uResolution: { value: [1, 1] },
      uImageSize: { value: [image.naturalWidth, image.naturalHeight] },
      uTime: { value: 0 },
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
  let current: Vec2 = { x: 0.5, y: 0.6 };
  let intensity = 0;
  const startedAt = performance.now();

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight);
    releaseCssSize();
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const handleLost = (event: Event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    onContextLost();
  };
  canvas.addEventListener('webglcontextlost', handleLost);

  const frame = () => {
    const seconds = (performance.now() - startedAt) / 1000;
    current = lerp2(current, target ?? driftPosition(seconds), 0.08);
    intensity = Math.min(1, intensity + 0.02);
    program.uniforms.uPointer.value = [current.x, current.y];
    program.uniforms.uTime.value = seconds;
    program.uniforms.uIntensity.value = intensity;
    renderer.render({ scene: mesh });
    if (running) raf = requestAnimationFrame(frame);
  };

  return {
    setPointer(uv) {
      target = uv;
    },
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', handleLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
