import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath, URL } from 'node:url';

export const BUDGET = { initialKb: 30, glKb: 40 };

// Static edges: `import x from "./a.js"`, `import"./a.js"`, `export * from "./a.js"` (minified or not).
const STATIC_IMPORT = /(?:^|[^\w$.])(?:import|export)\s*(?:[\w$*{}\s,]+?\s*from\s*)?(["'`])([^"'`\n]+)\1/g;
// Dynamic edges: `import("./a.js")` or import(`./a.js`) with a literal specifier.
const DYNAMIC_IMPORT = /\bimport\s*\(\s*(["'`])([^"'`\n$]+)\1\s*\)/g;
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function listFiles(dir, extension) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listFiles(full, extension);
    return name.endsWith(extension) ? [full] : [];
  });
}

const gzipBytes = (content) => gzipSync(content).length;

/** Resolves a specifier against the URL path it appears in; null for bare or external specifiers. */
function resolveUrl(specifier, fromUrlPath) {
  if (!/^(\.{1,2}\/|\/(?!\/))/.test(specifier)) return null;
  return new URL(specifier, `http://dist${fromUrlPath}`).pathname;
}

function parseImports(code) {
  const strip = (regex) => [...code.matchAll(regex)].map((match) => match[2]);
  return { static: strip(STATIC_IMPORT), dynamic: strip(DYNAMIC_IMPORT) };
}

function createGraph(distDir) {
  const cache = new Map();
  /** Returns the chunk at a URL path, or null when it is not a JS file in dist. */
  return (urlPath) => {
    if (cache.has(urlPath)) return cache.get(urlPath);
    const file = join(distDir, ...decodeURIComponent(urlPath).split('/'));
    let chunk = null;
    if (urlPath.endsWith('.js') && existsSync(file)) {
      const code = readFileSync(file, 'utf8');
      const imports = parseImports(code);
      const edges = (list) => list.map((s) => resolveUrl(s, urlPath)).filter((u) => u !== null);
      chunk = { bytes: gzipBytes(code), static: edges(imports.static), dynamic: edges(imports.dynamic) };
    }
    cache.set(urlPath, chunk);
    return chunk;
  };
}

/** Breadth-first walk from `roots`; `follow` picks which edges of a chunk to take. */
function closure(roots, chunkAt, follow, exclude = new Set()) {
  const seen = new Set();
  const queue = roots.filter((url) => !exclude.has(url));
  while (queue.length > 0) {
    const url = queue.shift();
    if (seen.has(url) || exclude.has(url)) continue;
    const chunk = chunkAt(url);
    if (chunk === null) continue;
    seen.add(url);
    queue.push(...follow(chunk));
  }
  return seen;
}

function measurePage(distDir, htmlFile, chunkAt) {
  const html = readFileSync(htmlFile, 'utf8');
  const pageUrl = `/${relative(distDir, htmlFile).split(/[\\/]/).join('/')}`;
  const staticRoots = [];
  const inlineDynamic = [];
  let inlineBytes = 0;
  for (const [, attrs, body] of html.matchAll(SCRIPT)) {
    if (!/\btype\s*=\s*["']?module["']?/i.test(attrs)) continue;
    const src = /\bsrc\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1];
    if (src !== undefined) {
      staticRoots.push(resolveUrl(src, pageUrl));
    } else if (body.trim() !== '') {
      // An inline module is initial JS itself; its imports are edges like a chunk's.
      inlineBytes += gzipBytes(body);
      const imports = parseImports(body);
      staticRoots.push(...imports.static.map((s) => resolveUrl(s, pageUrl)));
      inlineDynamic.push(...imports.dynamic.map((s) => resolveUrl(s, pageUrl)));
    }
  }

  const initial = closure(
    staticRoots.filter((url) => url !== null),
    chunkAt,
    (chunk) => chunk.static,
  );
  const dynamicRoots = [...initial]
    .flatMap((url) => chunkAt(url).dynamic)
    .concat(inlineDynamic.filter((url) => url !== null));
  const gl = closure(dynamicRoots, chunkAt, (chunk) => [...chunk.static, ...chunk.dynamic], initial);

  const sum = (urls) => [...urls].reduce((total, url) => total + chunkAt(url).bytes, 0);
  return {
    page: pageUrl,
    initialKb: (inlineBytes + sum(initial)) / 1024,
    glKb: sum(gl) / 1024,
  };
}

/** Per-page initial JS (static import closure) and WebGL JS (dynamic-only closure); max over pages. */
export function measure(distDir) {
  const chunkAt = createGraph(distDir);
  const pages = listFiles(distDir, '.html').map((file) => measurePage(distDir, file, chunkAt));
  const worst = (key) => pages.reduce((best, p) => (p[key] > (best?.[key] ?? -1) ? p : best), null);
  const initialPage = worst('initialKb');
  const glPage = worst('glKb');
  return {
    initialKb: initialPage?.initialKb ?? 0,
    glKb: glPage?.glKb ?? 0,
    initialPage: initialPage?.page ?? null,
    glPage: glPage?.page ?? null,
    pages,
  };
}

export function check(distDir, budget = BUDGET) {
  const result = measure(distDir);
  const errors = result.pages.flatMap((p) => [
    ...(p.initialKb > budget.initialKb
      ? [`JS inicial ${p.initialKb.toFixed(1)} KB > ${budget.initialKb} KB em ${p.page}`]
      : []),
    ...(p.glKb > budget.glKb ? [`JS WebGL ${p.glKb.toFixed(1)} KB > ${budget.glKb} KB em ${p.page}`] : []),
  ]);
  return { ...result, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { initialKb, glKb, initialPage, glPage, errors } = check(process.argv[2] ?? 'dist');
  console.log(
    `JS inicial: ${initialKb.toFixed(1)} KB gzip (${initialPage}) | JS WebGL: ${glKb.toFixed(1)} KB gzip (${glPage})`,
  );
  if (errors.length > 0) {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exit(1);
  }
  console.log('✓ Orçamento de JS cumprido');
}
