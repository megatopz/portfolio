import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { check, measure } from '../../scripts/check-budget.mjs';

type Chunk = { bytes: number; code?: string };

/**
 * Builds a fake dist: `pages` maps an HTML path to its markup, `chunks` maps a file under _astro/
 * to its import statements plus `bytes` of incompressible padding (gzip size ≈ raw size).
 */
function fakeDist(pages: Record<string, string>, chunks: Record<string, Chunk>): string {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  const write = (path: string, content: string | Buffer) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  for (const [path, html] of Object.entries(pages)) write(path, html);
  for (const [name, { bytes, code = '' }] of Object.entries(chunks)) {
    // Base64 padding in a block comment cannot look like an import; random bytes keep gzip ≈ raw size.
    const padding = randomBytes(bytes).toString('base64');
    write(join('_astro', name), `${code}\n/*${padding}*/`);
  }
  return dir;
}

const page = (...srcs: string[]) =>
  `<!doctype html><html><head>${srcs
    .map((src) => `<script type="module" src="${src}"></script>`)
    .join('')}</head><body></body></html>`;

const KB = 1024;

describe('check-budget', () => {
  it('follows static imports into the initial JS and dynamic imports into the WebGL JS', () => {
    const dir = fakeDist(
      { 'index.html': page('/_astro/entry.js') },
      {
        'entry.js': {
          bytes: 4 * KB,
          code: `import{a}from"./shared.js";import"./side.js";const m=()=>import(\`./scene.js\`);`,
        },
        'shared.js': { bytes: 2 * KB },
        'side.js': { bytes: 2 * KB },
        'scene.js': { bytes: 10 * KB, code: `import{b}from"./ogl.js";import{a}from"./shared.js";` },
        'ogl.js': { bytes: 20 * KB },
        'unused.js': { bytes: 50 * KB },
      },
    );
    const result = measure(dir);
    // entry + shared + side ≈ 8 KB; unused.js is never counted.
    expect(result.initialKb).toBeGreaterThan(7.5);
    expect(result.initialKb).toBeLessThan(9);
    // scene + ogl, but not shared.js again (it is already initial) ≈ 30 KB.
    expect(result.glKb).toBeGreaterThan(29.5);
    expect(result.glKb).toBeLessThan(31);
  });

  it('does not count a chunk named like a WebGL chunk as WebGL when it is statically imported', () => {
    const dir = fakeDist(
      { 'index.html': page('/_astro/entry.js') },
      {
        'entry.js': { bytes: 1 * KB, code: `import"./ink-overlay.js";` },
        'ink-overlay.js': { bytes: 6 * KB },
      },
    );
    const result = measure(dir);
    expect(result.initialKb).toBeGreaterThan(6.5);
    expect(result.glKb).toBe(0);
  });

  it('takes the maximum over pages instead of summing them', () => {
    const dir = fakeDist(
      {
        'pt/index.html': page('/_astro/a.js'),
        'lab/luz/index.html': page('/_astro/b.js'),
      },
      {
        'a.js': { bytes: 18 * KB },
        'b.js': { bytes: 18 * KB, code: `import("./gl.js")` },
        'gl.js': { bytes: 25 * KB },
      },
    );
    const result = measure(dir);
    // Each page carries ≈ 18 KB; summing would report ≈ 36 KB and fail the 30 KB budget.
    expect(result.initialKb).toBeGreaterThan(17.5);
    expect(result.initialKb).toBeLessThan(19);
    expect(result.glKb).toBeGreaterThan(24.5);
    expect(result.glKb).toBeLessThan(26);
    expect(check(dir).errors).toEqual([]);
  });

  it('follows imports in inline module scripts', () => {
    const dir = fakeDist(
      { 'index.html': `<script type="module">import "/_astro/x.js";</script>` },
      { 'x.js': { bytes: 5 * KB } },
    );
    expect(measure(dir).initialKb).toBeGreaterThan(4.5);
  });

  it('fails when the initial JS of one page exceeds 30 KB', () => {
    const dir = fakeDist(
      { 'pt/index.html': page('/_astro/big.js'), 'en/index.html': page('/_astro/small.js') },
      { 'big.js': { bytes: 35 * KB }, 'small.js': { bytes: 1 * KB } },
    );
    const { errors } = check(dir);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/inicial/);
    expect(errors[0]).toMatch(/pt/);
  });

  it('fails when the WebGL JS of one page exceeds 40 KB', () => {
    const dir = fakeDist(
      { 'index.html': page('/_astro/entry.js') },
      {
        'entry.js': { bytes: 1 * KB, code: `import("./light.js")` },
        'light.js': { bytes: 25 * KB, code: `import"./ogl.js";` },
        'ogl.js': { bytes: 20 * KB },
      },
    );
    const { errors, glKb } = check(dir);
    expect(glKb).toBeGreaterThan(40);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/WebGL/);
  });
});
