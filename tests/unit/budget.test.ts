import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { check } from '../../scripts/check-budget.mjs';

function fakeDist(files: Record<string, number>): string {
  const dir = mkdtempSync(join(tmpdir(), 'budget-'));
  mkdirSync(join(dir, '_astro'));
  for (const [name, bytes] of Object.entries(files)) {
    // random bytes do not compress, so gzip size ≈ raw size
    writeFileSync(join(dir, '_astro', name), randomBytes(bytes));
  }
  return dir;
}

describe('check-budget', () => {
  it('passes when both groups are under budget', () => {
    const dir = fakeDist({ 'ClientRouter.abc.js': 10_000, 'light.def.js': 20_000 });
    expect(check(dir).errors).toEqual([]);
  });
  it('classifies light/ink/ogl chunks as WebGL', () => {
    const dir = fakeDist({ 'page.abc.js': 1_000, 'ink.x1.js': 45_000 });
    const result = check(dir);
    expect(result.glKb).toBeGreaterThan(40);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/WebGL/);
  });
  it('fails when initial JS exceeds 30 KB', () => {
    const dir = fakeDist({ 'index.abc.js': 35_000 });
    expect(check(dir).errors[0]).toMatch(/inicial/);
  });
});
