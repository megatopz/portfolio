import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const BUDGET = { initialKb: 30, glKb: 40 };
const GL_CHUNK = /(^|[/._-])(light|ink|ogl)([._-]|$)/i;

function listJs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listJs(full);
    return name.endsWith('.js') ? [full] : [];
  });
}

export function measure(distDir) {
  const totals = { initial: 0, gl: 0 };
  for (const file of listJs(join(distDir, '_astro'))) {
    const size = gzipSync(readFileSync(file)).length;
    const name = file.split(/[\\/]/).pop() ?? '';
    if (GL_CHUNK.test(name)) totals.gl += size;
    else totals.initial += size;
  }
  return { initialKb: totals.initial / 1024, glKb: totals.gl / 1024 };
}

export function check(distDir, budget = BUDGET) {
  const result = measure(distDir);
  const errors = [];
  if (result.initialKb > budget.initialKb)
    errors.push(`JS inicial ${result.initialKb.toFixed(1)} KB > ${budget.initialKb} KB`);
  if (result.glKb > budget.glKb) errors.push(`JS WebGL ${result.glKb.toFixed(1)} KB > ${budget.glKb} KB`);
  return { ...result, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { initialKb, glKb, errors } = check(process.argv[2] ?? 'dist');
  console.log(`JS inicial: ${initialKb.toFixed(1)} KB gzip | JS WebGL: ${glKb.toFixed(1)} KB gzip`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exit(1);
  }
  console.log('✓ Orçamento de JS cumprido');
}
