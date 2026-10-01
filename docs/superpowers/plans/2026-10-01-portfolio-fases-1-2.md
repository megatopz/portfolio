# Portfolio — Fases 1 e 2 (Fundações e protótipos de motion) — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa a tarefa. Os passos usam checkboxes (`- [ ]`) para acompanhamento.

**Objetivo:** Criar a base do novo portfolio (Astro bilingue, design tokens, layout acessível, CI com orçamentos) e os dois protótipos de motion — a luz no hero e a transição de tinta — até ao gate de performance da fase 2.

**Arquitetura:** Site estático em Astro 7 com rotas `[lang]` próprias (PT/EN com slugs traduzidos), CSS nativo em camadas com tokens, e efeitos WebGL em OGL carregados só depois do conteúdo e sempre com imagem estática de recurso. As páginas `/lab/` servem para validar os efeitos isoladamente e não são indexadas.

**Tech stack:** Astro 7.3.5, TypeScript 6.0.3, OGL 1.0.11, Vitest 5.0.3, Playwright 1.63.0 + axe-core 4.13.0, Lighthouse CI 0.15.1, ESLint 10 + typescript-eslint 8.71, Prettier 3.9, sharp 0.35.5, fontes Fontsource (OFL).

**Especificação:** `docs/especificacao.md` — exportar a Claude Doc "Portfolio Gonçalo Guerra — Especificação" para Markdown e guardá-la nesse caminho no commit inicial (Tarefa 1). O plano argumenta a partir dela; quem executa lê os dois.

**Âmbito deste plano:** só as fases 1 e 2 da especificação. As fases 3 a 5 (páginas finais, case study, colofão, lançamento) ficam para um plano seguinte, porque dependem do resultado do gate da fase 2 e de conteúdo ainda em falta (textos finais, capturas do DonGonçalo, licenças).

**Estado da verificação:** o código deste plano foi construído e verificado num projeto de teste com as versões indicadas: `astro check` (0 erros), ESLint, Prettier, 30 testes unitários, `astro build` e orçamento de JS (8,1 KB inicial, 16,1 KB WebGL). **Os testes Playwright e o Lighthouse CI não puderam correr nesse ambiente** (sem acesso ao download dos browsers). Estão tipados e passam no lint, mas a primeira execução real é na máquina do Gonçalo ou no CI. Se falharem por razões de ambiente (WebGL em headless, tempos), corrigir o teste ou a configuração e registar a alteração no commit.

## Restrições globais

- Node ≥ 22.12.0 (exigido pelo Astro 7).
- Versões fixadas exatamente como em `package.json` (Tarefa 1). TypeScript fica em 6.0.3, **não** 7.x: o `@astrojs/check` 0.9.10 só aceita `^5 || ^6`.
- Rotas: `/pt/…` e `/en/…` com slugs traduzidos (`trabalho`/`work`, `sobre`/`about`) definidos só em `src/i18n/routes.ts`. Não se usa o middleware i18n do Astro, porque não suporta slugs traduzidos.
- `trailingSlash: 'always'` em todo o lado: links internos terminam em `/`.
- Orçamento: JS inicial ≤ 30 KB gzip; JS WebGL (chunks `light*`, `ink*`, `ogl*`) ≤ 40 KB gzip; LCP ≤ 2,0 s; CLS ≤ 0,05; Lighthouse ≥ 95 em performance, acessibilidade e boas práticas.
- WCAG 2.2 AA: texto ≥ 4,5:1; todo o conteúdo em HTML; canvas sempre `aria-hidden="true"` e sem texto.
- `prefers-reduced-motion: reduce` ou `forced-colors: active` → sem luz animada (foto estática) e sem overlay de tinta (crossfade de 150 ms).
- Sem pedidos a terceiros: fontes self-hosted via Fontsource, nada de CDNs.
- Cor: o site é monocromático (`--ink #0A0A0A`, `--paper #EFEDE8`, `--graphite #6B6B6B`, `--ash #A3A3A3`). A cor de projeto não entra nestas fases.
- Só se animam `transform`, `opacity` e uniforms de shader. O cursor nativo nunca é escondido.
- Conteúdo: nenhum facto inventado. Os textos destas fases são provisórios (nome, título da página); os textos finais entram na fase 3.
- Páginas `/lab/*` e `404`: `noindex` e fora do sitemap.
- O domínio ainda não está decidido: `site` vem de `SITE_URL` (variável de ambiente), com `http://localhost:4321` por omissão.

## Foco de revisão

Condições que a especificação implica e que uma pessoa real vai encontrar. Cada uma tem um teste na tarefa dona do código.

1. **Navegações rápidas seguidas** (clicar num link durante a transição): a tinta não pode ficar a tapar a página. Teste `rapid successive navigations…` na Tarefa 9.
2. **Perda do contexto WebGL** (GPU reiniciada, telemóvel em segundo plano): o hero volta à foto estática. Teste `falls back when the WebGL context is lost` na Tarefa 8.
3. **Textura que não carrega** (rede lenta ou erro 404): fica a foto, sem erros não tratados. Teste `falls back without uncaught errors…` na Tarefa 8.
4. **Redimensionar ou rodar o ecrã**: o canvas acompanha o tamanho, sem deformar. Teste `canvas follows viewport size changes` na Tarefa 8.
5. **Navegação só por teclado**: depois de navegar, a nova página é anunciada e o foco não se perde. Testes `keyboard navigation announces the new page` (Tarefa 9) e `skip link…` (Tarefa 4).

---

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
| --- | --- |
| `astro.config.mjs` | Site, trailing slash, sitemap filtrado, chunk `ogl` separado |
| `src/i18n/config.ts` | Locales e validação |
| `src/i18n/routes.ts` | Mapa de rotas traduzidas; `pathFor`, `parsePath`, `alternatePath` |
| `src/i18n/ui.ts` | Dicionário de textos de interface; `t()` |
| `src/styles/layers.css` | Ordem das camadas CSS |
| `src/styles/reset.css`, `base.css` | Reset e estilos base (foco, skip link, rótulos, reduced motion) |
| `src/styles/tokens.css` | Fonte única dos tokens (cor, tipo, espaço, tempo) e superfícies `paper`/`ink` |
| `src/layouts/Base.astro` | Documento HTML, meta, hreflang, ClientRouter, skip link, overlay de tinta |
| `src/components/LanguageSwitch.astro` | Troca de idioma que mantém a página |
| `src/components/HeroLight.astro` | Foto + canvas da luz; monta o efeito |
| `src/components/InkTransition.astro` | Canvas persistente + ligação aos eventos do ClientRouter |
| `src/motion/math.ts`, `prefs.ts` | Matemática pura e preferências do utilizador (testáveis sem DOM) |
| `src/gl/light/*` | Shaders, cena OGL e montagem da luz |
| `src/gl/ink/*` | Shaders, easing e overlay OGL da tinta |
| `src/pages/…` | Raiz (redirect), `[lang]/index`, `404`, `lab/*` |
| `scripts/check-budget.mjs` | Orçamento de JS sobre `dist/` |
| `scripts/prepare-photos.mjs` | Recorte das fotos acima do logótipo da t-shirt |
| `tests/unit/*`, `tests/e2e/*` | Vitest e Playwright |

---

### Tarefa 1: Projeto base e ferramentas

**Ficheiros:**
- Criar: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `public/favicon.svg`, `src/pages/index.astro`, `docs/especificacao.md`

**Interfaces:**
- Produz: scripts npm `dev`, `build`, `preview`, `check`, `lint`, `format`, `format:check`, `test:unit`, `test:e2e`, `budget`, `photos`, usados por todas as tarefas.

- [ ] **Passo 1: Criar o repositório**

```bash
mkdir portfolio && cd portfolio
git init -b main
mkdir -p docs src/pages public
```

Exportar a especificação (Claude Doc → Exportar → Markdown) para `docs/especificacao.md`.

- [ ] **Passo 2: Escrever `package.json`**

```json
{
  "name": "portfolio",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "budget": "node scripts/check-budget.mjs dist",
    "photos": "node scripts/prepare-photos.mjs"
  },
  "dependencies": {
    "@astrojs/sitemap": "3.7.4",
    "@fontsource-variable/archivo": "5.3.0",
    "@fontsource-variable/bricolage-grotesque": "5.3.0",
    "@fontsource-variable/jetbrains-mono": "5.3.0",
    "astro": "7.3.5",
    "ogl": "1.0.11"
  },
  "type": "module",
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@axe-core/playwright": "4.13.0",
    "@eslint/js": "10.0.1",
    "@playwright/test": "1.63.0",
    "eslint": "10.11.0",
    "eslint-plugin-astro": "3.2.1",
    "prettier": "3.9.9",
    "prettier-plugin-astro": "1.1.0",
    "typescript": "6.0.3",
    "typescript-eslint": "8.71.0",
    "vitest": "5.0.3",
    "sharp": "0.35.5"
  },
  "private": true,
  "engines": {
    "node": ">=22.12.0"
  }
}
```

- [ ] **Passo 3: Escrever as configurações**

`astro.config.mjs`:

```js
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // SITE_URL is set in Vercel once the domain is chosen (spec: Decisões em aberto).
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/lab/') && !page.includes('/404') })],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/ogl')) return 'ogl';
          },
        },
      },
    },
  },
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src", "tests", "scripts", "*.config.*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "allowJs": true,
    "noUncheckedIndexedAccess": true
  }
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' } });
```

`eslint.config.js`:

```js
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', 'test-results/', 'playwright-report/', '.lighthouseci/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['scripts/**/*.mjs', 'astro.config.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
];
```

`.prettierrc.json`:

```json
{
  "singleQuote": true,
  "printWidth": 110,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

`.prettierignore` (`docs/` fica de fora porque a especificação exportada e os registos de gate não seguem o estilo do Prettier):

```text
docs/
dist/
.astro/
node_modules/
test-results/
playwright-report/
.lighthouseci/
package-lock.json
```

`.gitignore`:

```text
node_modules/
dist/
.astro/
.vercel/
test-results/
playwright-report/
.lighthouseci/
assets-src/
.env
```

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0a0a0a"/><text x="16" y="22" font-family="Arial" font-size="14" font-weight="700" fill="#efede8" text-anchor="middle">GG</text></svg>
```

- [ ] **Passo 4: Página raiz que encaminha para `/pt/`**

`src/pages/index.astro`:

```astro
---
// Static fallback; production uses the 307 redirect in vercel.json.
return Astro.redirect('/pt/');
---
```

- [ ] **Passo 5: Instalar e verificar**

```bash
npm install
npm run check
npm run lint
npm run format:check
npm run build
grep -o 'url=/pt/' dist/index.html
```

Esperado: `check` com 0 erros, lint e formato limpos, build concluído, e o `grep` imprime `url=/pt/`.

- [ ] **Passo 6: Commit**

```bash
git add -A
git commit -m "chore: base do projeto Astro com ferramentas de qualidade"
```

---

### Tarefa 2: Rotas e textos bilingues

**Ficheiros:**
- Criar: `src/i18n/config.ts`, `src/i18n/routes.ts`, `src/i18n/ui.ts`
- Testes: `tests/unit/routes.test.ts`, `tests/unit/ui.test.ts`

**Interfaces:**
- Produz:
  - `locales: readonly ['pt', 'en']`, `type Locale`, `defaultLocale: Locale`, `isLocale(value: string | undefined): value is Locale`
  - `type RouteKey = 'home' | 'work' | 'about'`
  - `pathFor(locale: Locale, key: RouteKey, slug?: string): string` — sempre com `/` final
  - `parsePath(pathname: string): { locale; key; slug? } | null`
  - `alternatePath(pathname: string, target: Locale): string` — a mesma página no outro idioma, ou a home desse idioma
  - `ui`, `type UiKey`, `t(locale: Locale, key: UiKey): string`

- [ ] **Passo 1: Escrever os testes que falham**

`tests/unit/routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alternatePath, parsePath, pathFor } from '../../src/i18n/routes';

describe('pathFor', () => {
  it('builds localized paths with trailing slash', () => {
    expect(pathFor('pt', 'home')).toBe('/pt/');
    expect(pathFor('en', 'work')).toBe('/en/work/');
    expect(pathFor('pt', 'work', 'don-goncalo')).toBe('/pt/trabalho/don-goncalo/');
  });
});

describe('parsePath', () => {
  it('parses home, sections and slugs', () => {
    expect(parsePath('/pt/')).toEqual({ locale: 'pt', key: 'home' });
    expect(parsePath('/en/about')).toEqual({ locale: 'en', key: 'about' });
    expect(parsePath('/pt/trabalho/don-goncalo/')).toEqual({
      locale: 'pt',
      key: 'work',
      slug: 'don-goncalo',
    });
  });
  it('rejects unknown locales, sections and deep paths', () => {
    expect(parsePath('/fr/')).toBeNull();
    expect(parsePath('/pt/work/')).toBeNull();
    expect(parsePath('/pt/trabalho/a/b/')).toBeNull();
    expect(parsePath('/')).toBeNull();
  });
});

describe('alternatePath', () => {
  it('keeps the same page when switching language', () => {
    expect(alternatePath('/pt/sobre/', 'en')).toBe('/en/about/');
    expect(alternatePath('/en/work/don-goncalo/', 'pt')).toBe('/pt/trabalho/don-goncalo/');
  });
  it('falls back to the target home for unknown paths', () => {
    expect(alternatePath('/lab/luz/', 'en')).toBe('/en/');
  });
});
```

`tests/unit/ui.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { t, ui } from '../../src/i18n/ui';

describe('ui dictionary', () => {
  it('has the same keys in every locale', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.pt).sort());
  });
  it('has no empty strings', () => {
    for (const dict of Object.values(ui)) {
      for (const value of Object.values(dict)) expect(value.trim()).not.toBe('');
    }
  });
  it('translates by locale', () => {
    expect(t('pt', 'nav.work')).toBe('Trabalho');
    expect(t('en', 'nav.work')).toBe('Work');
  });
});
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:unit`
Esperado: FAIL — os módulos `src/i18n/routes` e `src/i18n/ui` não existem.

- [ ] **Passo 3: Implementar**

`src/i18n/config.ts`:

```ts
export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'pt' || value === 'en';
}
```

`src/i18n/routes.ts`:

```ts
import { isLocale, type Locale } from './config';

export const routes = {
  home: { pt: '', en: '' },
  work: { pt: 'trabalho', en: 'work' },
  about: { pt: 'sobre', en: 'about' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

export interface ParsedPath {
  locale: Locale;
  key: RouteKey;
  slug?: string;
}

export function pathFor(locale: Locale, key: RouteKey, slug?: string): string {
  const parts = [locale, routes[key][locale], slug].filter((part): part is string => Boolean(part));
  return `/${parts.join('/')}/`;
}

export function parsePath(pathname: string): ParsedPath | null {
  const [first, second, third, ...rest] = pathname.split('/').filter(Boolean);
  if (!isLocale(first) || rest.length > 0) return null;
  if (second === undefined) return { locale: first, key: 'home' };
  const key = (Object.keys(routes) as RouteKey[]).find(
    (candidate) => candidate !== 'home' && routes[candidate][first] === second,
  );
  if (key === undefined) return null;
  return third === undefined ? { locale: first, key } : { locale: first, key, slug: third };
}

export function alternatePath(pathname: string, target: Locale): string {
  const parsed = parsePath(pathname);
  if (parsed === null) return pathFor(target, 'home');
  return pathFor(target, parsed.key, parsed.slug);
}
```

`src/i18n/ui.ts`:

```ts
import type { Locale } from './config';

export const ui = {
  pt: {
    'skip.toMain': 'Saltar para o conteúdo',
    'lang.label': 'Idioma',
    'lang.pt': 'Português',
    'lang.en': 'English',
    'nav.home': 'Início',
    'nav.work': 'Trabalho',
    'nav.about': 'Sobre',
    'home.title': 'Gonçalo Guerra — Designer e developer web',
    'home.description': 'Portfolio de Gonçalo Guerra, designer e developer web.',
  },
  en: {
    'skip.toMain': 'Skip to content',
    'lang.label': 'Language',
    'lang.pt': 'Português',
    'lang.en': 'English',
    'nav.home': 'Home',
    'nav.work': 'Work',
    'nav.about': 'About',
    'home.title': 'Gonçalo Guerra — Web designer and developer',
    'home.description': 'Portfolio of Gonçalo Guerra, web designer and developer.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['pt'];

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}
```

- [ ] **Passo 4: Correr e confirmar que passam**

Correr: `npm run test:unit`
Esperado: PASS, 8 testes.

- [ ] **Passo 5: Commit**

```bash
git add src/i18n tests/unit/routes.test.ts tests/unit/ui.test.ts
git commit -m "feat(i18n): rotas traduzidas e dicionário de interface"
```

---

### Tarefa 3: Design tokens e estilos base

**Ficheiros:**
- Criar: `src/styles/layers.css`, `src/styles/reset.css`, `src/styles/tokens.css`, `src/styles/base.css`
- Teste: `tests/unit/contrast.test.ts`

**Interfaces:**
- Produz: custom properties `--ink`, `--paper`, `--graphite`, `--ash`, `--font-display`, `--font-text`, `--font-mono`, `--step--1` … `--step-4`, `--step-hero`, `--measure`, `--space-*`, `--t-fast|base|slow`, `--ease-out`, `--ease-in-out`, `--rule-width`; superfícies `[data-surface='paper'|'ink']` que definem `--bg`, `--fg`, `--fg-muted`, `--rule`; classes `.skip-link`, `.label`, `.visually-hidden`.

- [ ] **Passo 1: Escrever o teste de contraste que falha**

O teste lê `tokens.css` diretamente, para os valores testados serem os mesmos que o site usa.

`tests/unit/contrast.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match?.[1]) throw new Error(`token --${name} not found`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('text colour pairs meet WCAG AA (4.5:1)', () => {
  it.each([
    ['ink', 'paper'],
    ['graphite', 'paper'],
    ['ash', 'ink'],
  ])('--%s on --%s', (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Passo 2: Correr e confirmar que falha**

Correr: `npm run test:unit -- contrast`
Esperado: FAIL com `ENOENT` (o ficheiro `tokens.css` não existe).

- [ ] **Passo 3: Implementar os estilos**

`src/styles/layers.css` (tem de ser o primeiro CSS importado, para fixar a ordem das camadas):

```css
@layer reset, tokens, base, components, utilities;
```

`src/styles/reset.css`:

```css
@layer reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  * {
    margin: 0;
  }
  html {
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
  body {
    min-height: 100svh;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  img,
  picture,
  svg,
  canvas,
  video {
    display: block;
    max-width: 100%;
  }
  input,
  button,
  textarea,
  select {
    font: inherit;
  }
  h1,
  h2,
  h3,
  h4,
  p {
    overflow-wrap: break-word;
  }
  h1,
  h2,
  h3 {
    line-height: 1.05;
    text-wrap: balance;
  }
  p {
    text-wrap: pretty;
  }
}
```

`src/styles/tokens.css`:

```css
@layer tokens {
  :root {
    --ink: #0a0a0a;
    --paper: #efede8;
    --graphite: #6b6b6b;
    --ash: #a3a3a3;

    --font-display: 'Archivo Variable', 'Archivo', 'Helvetica Neue', Arial, sans-serif;
    --font-text: 'Archivo Variable', 'Archivo', 'Helvetica Neue', Arial, sans-serif;
    --font-mono:
      'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

    --step--1: clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem);
    --step-0: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
    --step-1: clamp(1.33rem, 1.2rem + 0.6vw, 1.58rem);
    --step-2: clamp(1.66rem, 1.45rem + 1vw, 2.11rem);
    --step-3: clamp(2.07rem, 1.7rem + 1.8vw, 2.81rem);
    --step-4: clamp(2.59rem, 2rem + 3vw, 3.75rem);
    --step-hero: clamp(3.5rem, 1rem + 12vw, 14vw);
    --measure: 68ch;

    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-12: 3rem;
    --space-16: 4rem;
    --space-24: 6rem;

    --t-fast: 150ms;
    --t-base: 250ms;
    --t-slow: 500ms;
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

    --rule-width: 1px;
  }

  [data-surface='paper'] {
    --bg: var(--paper);
    --fg: var(--ink);
    --fg-muted: var(--graphite);
    --rule: color-mix(in srgb, var(--ink) 12%, transparent);
  }

  [data-surface='ink'] {
    --bg: var(--ink);
    --fg: var(--paper);
    --fg-muted: var(--ash);
    --rule: color-mix(in srgb, var(--paper) 12%, transparent);
  }
}
```

`src/styles/base.css`:

```css
@layer base {
  body {
    font-family: var(--font-text);
    font-size: var(--step-0);
  }
  [data-surface] {
    background: var(--bg);
    color: var(--fg);
  }
  a {
    color: inherit;
    text-decoration-thickness: var(--rule-width);
    text-underline-offset: 0.2em;
  }
  :focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }
  main:focus {
    outline: none;
  }
  .skip-link {
    position: absolute;
    top: var(--space-4);
    left: var(--space-4);
    z-index: 1001;
    padding: var(--space-2) var(--space-4);
    background: var(--fg);
    color: var(--bg);
    transform: translateY(-200%);
  }
  .skip-link:focus-visible {
    transform: none;
  }
  .label {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: var(--t-fast);
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 1ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Passo 4: Correr e confirmar que passa**

Correr: `npm run test:unit -- contrast`
Esperado: PASS, 3 testes. Valores atuais: ink/paper 16,9:1; graphite/paper 4,55:1; ash/ink 7,85:1. O `--graphite` tem pouca margem: qualquer alteração futura que o escureça menos falha este teste, e é isso que se quer.

- [ ] **Passo 5: Commit**

```bash
git add src/styles tests/unit/contrast.test.ts
git commit -m "feat(design): tokens, superfícies papel/tinta e estilos base"
```

---

### Tarefa 4: Layout base, troca de idioma, 404 e testes end-to-end

**Ficheiros:**
- Criar: `src/layouts/Base.astro`, `src/components/LanguageSwitch.astro`, `src/pages/[lang]/index.astro`, `src/pages/404.astro`, `playwright.config.ts`
- Testes: `tests/e2e/i18n.spec.ts`, `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Consome: `locales`, `defaultLocale`, `Locale`, `alternatePath`, `t` (Tarefa 2); tokens e classes (Tarefa 3).
- Produz:
  - `Base.astro` com props `{ title: string; description: string; locale?: Locale; noindex?: boolean; surface?: 'paper' | 'ink' }`, um slot por omissão (dentro de `<main id="main">`) e `slot="header"`.
  - `LanguageSwitch.astro` com prop `{ locale: Locale }`; renderiza `nav.lang-switch` com `a[hreflang]` e `aria-current="true"` no idioma atual.

- [ ] **Passo 1: Configurar o Playwright**

```bash
npx playwright install chromium
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Headless Chromium needs SwiftShader for WebGL on machines without a GPU (CI).
        launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321/pt/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Passo 2: Escrever os testes que falham**

`tests/e2e/i18n.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('root redirects to /pt/', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL('**/pt/', { timeout: 5_000 });
});

for (const [lang, other] of [
  ['pt', 'en'],
  ['en', 'pt'],
] as const) {
  test(`/${lang}/ declares its language and alternates`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveAttribute(
      'href',
      new RegExp(`/${other}/$`),
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      /\/pt\/$/,
    );
  });

  test(`language switch on /${lang}/ goes to /${other}/`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await expect(page.locator(`.lang-switch a[hreflang="${lang}"]`)).toHaveAttribute('aria-current', 'true');
    await page.locator(`.lang-switch a[hreflang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/$`));
    await expect(page.locator('html')).toHaveAttribute('lang', other);
  });
}

test('unknown routes return the bilingual 404 page', async ({ page }) => {
  const response = await page.goto('/nao-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('p[lang="pt"] a')).toHaveAttribute('href', '/pt/');
  await expect(page.locator('p[lang="en"] a')).toHaveAttribute('href', '/en/');
});
```

`tests/e2e/a11y.spec.ts`. Nesta tarefa, a lista de páginas e os testes são só estes; as Tarefas 5, 8 e 9 acrescentam páginas.

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/pt/', '/en/', '/nao-existe/'];

for (const path of pages) {
  test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('skip link is the first focus stop and moves focus to main', async ({ page }) => {
  await page.goto('/pt/');
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});
```

- [ ] **Passo 3: Correr e confirmar que falham**

Correr: `npm run test:e2e`
Esperado: FAIL — `/pt/` e `/en/` devolvem 404 e não existe skip link.

- [ ] **Passo 4: Implementar o layout e as páginas**

`src/layouts/Base.astro`. Nesta tarefa **sem** o overlay de tinta, que só entra na Tarefa 9:

```astro
---
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '../styles/layers.css';
import '../styles/reset.css';
import '../styles/tokens.css';
import '../styles/base.css';
import { ClientRouter } from 'astro:transitions';
import { defaultLocale, locales, type Locale } from '../i18n/config';
import { alternatePath } from '../i18n/routes';
import { t } from '../i18n/ui';

interface Props {
  title: string;
  description: string;
  /** Omit on non-localized pages (lab, 404). */
  locale?: Locale;
  noindex?: boolean;
  surface?: 'paper' | 'ink';
}

const { title, description, locale, noindex = false, surface = 'paper' } = Astro.props;
const lang = locale ?? defaultLocale;
const canonical = new URL(Astro.url.pathname, Astro.site);
const alternates = locale
  ? locales.map((l) => ({
      hreflang: l,
      href: new URL(alternatePath(Astro.url.pathname, l), Astro.site).href,
    }))
  : [];
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical.href} />
    {noindex && <meta name="robots" content="noindex" />}
    {alternates.map((a) => (
      <link rel="alternate" hreflang={a.hreflang} href={a.href} />
    ))}
    {locale && (
      <link
        rel="alternate"
        hreflang="x-default"
        href={new URL(alternatePath(Astro.url.pathname, defaultLocale), Astro.site).href}
      />
    )}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <ClientRouter fallback="swap" />
  </head>
  <body data-surface={surface}>
    <a class="skip-link" href="#main">
      {t(lang, 'skip.toMain')}
    </a>
    <slot name="header" />
    <main id="main" tabindex="-1">
      <slot />
    </main>
  </body>
</html>
```

`src/components/LanguageSwitch.astro`:

```astro
---
import { locales, type Locale } from '../i18n/config';
import { alternatePath } from '../i18n/routes';
import { t } from '../i18n/ui';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
---

<nav class="lang-switch" aria-label={t(locale, 'lang.label')}>
  <ul role="list">
    {locales.map((l) => (
      <li>
        <a
          class="label"
          href={alternatePath(Astro.url.pathname, l)}
          hreflang={l}
          lang={l}
          aria-current={l === locale ? 'true' : undefined}
        >
          {l.toUpperCase()}
          <span class="visually-hidden">{t(l, l === 'pt' ? 'lang.pt' : 'lang.en')}</span>
        </a>
      </li>
    ))}
  </ul>
</nav>

<style>
  ul {
    display: flex;
    gap: var(--space-3);
    padding: 0;
    list-style: none;
  }
  a {
    text-decoration: none;
    color: var(--fg-muted);
  }
  a[aria-current='true'] {
    color: var(--fg);
    text-decoration: underline;
  }
</style>
```

`src/pages/[lang]/index.astro` (página provisória; o Início real é da fase 3):

```astro
---
import LanguageSwitch from '../../components/LanguageSwitch.astro';
import { locales, type Locale } from '../../i18n/config';
import { t } from '../../i18n/ui';
import Base from '../../layouts/Base.astro';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

const locale = Astro.params.lang as Locale;
---

<Base title={t(locale, 'home.title')} description={t(locale, 'home.description')} locale={locale}>
  <header slot="header" class="site-header">
    <LanguageSwitch locale={locale} />
  </header>
  <h1>Gonçalo Guerra</h1>
</Base>
```

`src/pages/404.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="404 — Gonçalo Guerra" description="Página não encontrada · Page not found" noindex>
  <h1>404</h1>
  <p lang="pt">
    Esta página não existe. <a href="/pt/">Voltar ao início</a>
  </p>
  <p lang="en">
    This page does not exist. <a href="/en/">Back to home</a>
  </p>
</Base>
```

- [ ] **Passo 5: Correr e confirmar que passam**

Correr: `npm run check && npm run test:e2e`
Esperado: 0 erros de tipos; todos os testes de `i18n.spec.ts` e `a11y.spec.ts` PASS.

- [ ] **Passo 6: Commit**

```bash
git add src/layouts src/components/LanguageSwitch.astro src/pages playwright.config.ts tests/e2e
git commit -m "feat: layout base acessível, troca de idioma e 404 bilingue"
```

---

### Tarefa 5: Fotos recortadas e especímenes tipográficos

**Ficheiros:**
- Criar: `scripts/prepare-photos.mjs`, `src/assets/photos/eu.jpg`, `src/assets/photos/eu2.jpg` (gerados), `src/pages/lab/tipografia.astro`
- Modificar: `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Produz: `src/assets/photos/eu.jpg` (1600×1340) e `src/assets/photos/eu2.jpg` (1600×1370), importáveis como `ImageMetadata`; página `/lab/tipografia/` para a escolha da fonte display (decisão da especificação: escolha final após especímenes).

- [ ] **Passo 1: Acrescentar os testes que falham**

Em `tests/e2e/a11y.spec.ts`, substituir a linha `const pages = …` por:

```ts
const pages = ['/pt/', '/en/', '/nao-existe/', '/lab/tipografia/'];
```

E acrescentar no fim do ficheiro:

```ts
test('lab pages are not indexed and are excluded from the sitemap', async ({ page, request }) => {
  await page.goto('/lab/tipografia/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toContain('/lab/');
  expect(sitemap).toContain('/pt/');
  expect(sitemap).toContain('/en/');
});
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:e2e -- a11y`
Esperado: FAIL — `/lab/tipografia/` não existe.

- [ ] **Passo 3: Recortar as fotos**

Copiar `eu.jpeg` e `eu2.jpeg` originais para `assets-src/` (pasta ignorada pelo git; os originais não vão para o repositório público).

`scripts/prepare-photos.mjs`:

```js
import sharp from 'sharp';

// Crops remove the t-shirt logo at the bottom of each photo (see spec: Inventário).
const jobs = [
  { input: 'assets-src/eu.jpeg', output: 'src/assets/photos/eu.jpg', height: 1340 },
  { input: 'assets-src/eu2.jpeg', output: 'src/assets/photos/eu2.jpg', height: 1370 },
];

for (const { input, output, height } of jobs) {
  const { width } = await sharp(input).metadata();
  await sharp(input)
    .extract({ left: 0, top: 0, width, height })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(output);
  console.log(`✓ ${output} (${width}×${height})`);
}
```

```bash
mkdir -p src/assets/photos
npm run photos
```

Esperado: `✓ src/assets/photos/eu.jpg (1600×1340)` e `✓ src/assets/photos/eu2.jpg (1600×1370)`. Abrir as duas imagens e confirmar que nenhuma letra do logótipo da t-shirt aparece no fundo (os recortes já foram verificados visualmente na preparação do plano).

- [ ] **Passo 4: Página de especímenes**

`src/pages/lab/tipografia.astro`:

```astro
---
import '@fontsource-variable/bricolage-grotesque/index.css';
import Base from '../../layouts/Base.astro';

const samples = [
  'Gonçalo Guerra',
  'Desenho e construo produtos digitais, do primeiro esboço ao deploy.',
  'I design and build digital products, from first sketch to deploy.',
  'Don Gonçalo — da cozinha ao código',
];
const candidates = [
  { name: 'Archivo · largura 62%', family: "'Archivo Variable', sans-serif", stretch: '62%', weight: 800 },
  { name: 'Archivo · largura 100%', family: "'Archivo Variable', sans-serif", stretch: '100%', weight: 800 },
  { name: 'Archivo · largura 125%', family: "'Archivo Variable', sans-serif", stretch: '125%', weight: 700 },
  {
    name: 'Bricolage Grotesque',
    family: "'Bricolage Grotesque Variable', sans-serif",
    stretch: '100%',
    weight: 800,
  },
];
---

<Base title="Lab · Tipografia" description="Especímenes tipográficos para escolha da fonte display" noindex>
  <div class="specimens">
    {candidates.map((c) => (
      <section
        class="specimen"
        style={`--family: ${c.family}; --stretch: ${c.stretch}; --weight: ${c.weight};`}
      >
        <h2 class="label">{c.name}</h2>
        <p class="hero">{samples[0]}</p>
        {samples.slice(1).map((s) => (
          <p class="title">{s}</p>
        ))}
        <p class="body">
          Trabalhei no Don Gonçalo como empregado de mesa, ajudante de cozinha e pizzaiolo, e depois construí
          a plataforma do restaurante.
        </p>
      </section>
    ))}
  </div>
</Base>

<style>
  .specimens {
    display: grid;
    gap: var(--space-16);
    padding: var(--space-8);
  }
  .specimen {
    display: grid;
    gap: var(--space-4);
    border-top: var(--rule-width) solid var(--rule);
    padding-top: var(--space-6);
  }
  .hero,
  .title {
    font-family: var(--family);
    font-stretch: var(--stretch);
    font-weight: var(--weight);
    line-height: 0.95;
    text-transform: uppercase;
  }
  .hero {
    font-size: var(--step-hero);
  }
  .title {
    font-size: var(--step-3);
    max-width: 24ch;
  }
  .body {
    max-width: var(--measure);
  }
</style>
```

- [ ] **Passo 5: Correr e confirmar que passam**

Correr: `npm run check && npm run test:e2e -- a11y`
Esperado: PASS.

- [ ] **Passo 6: Escolha da fonte (decisão humana)**

Abrir `npm run dev` → `/lab/tipografia/` em desktop e telemóvel. O Gonçalo escolhe a fonte display e a largura. Registar a decisão em `docs/decisoes.md` (uma linha com data e escolha). Se a escolha não for Archivo, trocar `--font-display` em `tokens.css` e o import em `Base.astro` na fase 3; o resto deste plano não depende disso.

- [ ] **Passo 7: Commit**

```bash
git add scripts/prepare-photos.mjs src/assets src/pages/lab tests/e2e/a11y.spec.ts docs/decisoes.md
git commit -m "feat(lab): fotos recortadas e especímenes tipográficos"
```

---

### Tarefa 6: Orçamento de JS, Lighthouse CI, GitHub Actions e Vercel

**Ficheiros:**
- Criar: `scripts/check-budget.mjs`, `lighthouserc.json`, `.github/workflows/ci.yml`, `vercel.json`
- Teste: `tests/unit/budget.test.ts`

**Interfaces:**
- Produz: `measure(distDir: string): { initialKb: number; glKb: number }`, `check(distDir: string, budget?): { initialKb; glKb; errors: string[] }`, `BUDGET = { initialKb: 30, glKb: 40 }`. Chunks cujo nome contém `light`, `ink` ou `ogl` (separados por `.`, `-` ou `_`) contam como WebGL; tudo o resto conta como inicial.

- [ ] **Passo 1: Escrever o teste que falha**

`tests/unit/budget.test.ts`:

```ts
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
```

- [ ] **Passo 2: Correr e confirmar que falha**

Correr: `npm run test:unit -- budget`
Esperado: FAIL — `scripts/check-budget.mjs` não existe.

- [ ] **Passo 3: Implementar**

`scripts/check-budget.mjs`:

```js
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
```

- [ ] **Passo 4: Correr e confirmar que passa**

```bash
npm run test:unit -- budget
npm run build && npm run budget
```

Esperado: 3 testes PASS; `✓ Orçamento de JS cumprido`.

- [ ] **Passo 5: Lighthouse CI, CI e Vercel**

`lighthouserc.json`. O INP não é medível em laboratório; o Total Blocking Time ≤ 150 ms é o indicador substituto. O `/lab/luz/` só existe a partir da Tarefa 8: até lá, retirar esse URL ou aceitar a falha nesse URL.

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": ["http://localhost/pt/", "http://localhost/lab/luz/"],
      "numberOfRuns": 3,
      "settings": { "preset": "perf", "formFactor": "mobile", "throttlingMethod": "simulate" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
        "total-blocking-time": ["error", { "maxNumericValue": 150 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test:unit
      - run: npm run build
      - run: npm run budget
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npx @lhci/cli@0.15.1 autorun
```

`vercel.json` (redirect real de `/` para `/pt/`, cabeçalhos básicos e cache longa para assets com hash; a CSP fica para a fase 5, testada com o site completo):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "trailingSlash": true,
  "redirects": [{ "source": "/", "destination": "/pt/", "permanent": false }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

- [ ] **Passo 6: Verificar localmente**

```bash
npm run build
npx @lhci/cli@0.15.1 autorun
```

Esperado: asserções cumpridas em `/pt/`. Registar no commit os valores de performance e LCP obtidos.

- [ ] **Passo 7: Publicar e ligar**

Criar o repositório público no GitHub (nome de utilizador ainda em decisão; ver especificação), fazer push e ligar o projeto à Vercel (Framework: Astro). Confirmar que o CI corre verde no primeiro push.

- [ ] **Passo 8: Commit**

```bash
git add scripts/check-budget.mjs tests/unit/budget.test.ts lighthouserc.json .github vercel.json
git commit -m "ci: orçamento de JS, Lighthouse CI, GitHub Actions e Vercel"
```

---

### Tarefa 7: Utilitários de motion

**Ficheiros:**
- Criar: `src/motion/math.ts`, `src/motion/prefs.ts`, `src/gl/ink/ink-easing.ts`
- Testes: `tests/unit/math.test.ts`, `tests/unit/prefs.test.ts`, `tests/unit/ink-easing.test.ts`

**Interfaces:**
- Produz:
  - `interface Vec2 { x: number; y: number }`
  - `lerp2(current: Vec2, target: Vec2, factor: number): Vec2` (factor limitado a [0, 1])
  - `driftPosition(seconds: number): Vec2` (sempre dentro de [0,2; 0,8])
  - `clampDpr(devicePixelRatio: number, max = 1.5): number`
  - `toUv(clientX, clientY, rect): Vec2` (0..1, y para cima, limitado)
  - `interface MotionPrefs { reduced(): boolean; onChange(listener: (reduced: boolean) => void): () => void }`
  - `createMotionPrefs(host: { matchMedia(q: string): MediaQueryList }): MotionPrefs` — `reduced()` é verdadeiro com `prefers-reduced-motion: reduce` **ou** `forced-colors: active`
  - `supportsWebGL(doc: { createElement(tag: 'canvas'): HTMLCanvasElement }): boolean`
  - `easeInOut(t: number): number`, `tweenValue(from, to, elapsed, duration): number`

- [ ] **Passo 1: Escrever os testes que falham**

`tests/unit/math.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampDpr, driftPosition, lerp2, toUv } from '../../src/motion/math';

describe('lerp2', () => {
  it('moves a fraction of the way to the target', () => {
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 2 }, 0.5)).toEqual({ x: 0.5, y: 1 });
  });
  it('clamps the factor to [0, 1]', () => {
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 1 }, 2)).toEqual({ x: 1, y: 1 });
    expect(lerp2({ x: 0, y: 0 }, { x: 1, y: 1 }, -1)).toEqual({ x: 0, y: 0 });
  });
});

describe('driftPosition', () => {
  it('stays inside [0.2, 0.8] over a long period', () => {
    for (let s = 0; s < 600; s += 0.5) {
      const p = driftPosition(s);
      expect(p.x).toBeGreaterThanOrEqual(0.2);
      expect(p.x).toBeLessThanOrEqual(0.8);
      expect(p.y).toBeGreaterThanOrEqual(0.2);
      expect(p.y).toBeLessThanOrEqual(0.8);
    }
  });
});

describe('clampDpr', () => {
  it('caps at 1.5 and guards invalid values', () => {
    expect(clampDpr(3)).toBe(1.5);
    expect(clampDpr(1)).toBe(1);
    expect(clampDpr(0)).toBe(1);
    expect(clampDpr(Number.NaN)).toBe(1);
  });
});

describe('toUv', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  it('maps the rect to 0..1 with y pointing up', () => {
    expect(toUv(100, 150, rect)).toEqual({ x: 0, y: 0 });
    expect(toUv(300, 50, rect)).toEqual({ x: 1, y: 1 });
  });
  it('clamps positions outside the rect', () => {
    expect(toUv(0, 0, rect)).toEqual({ x: 0, y: 1 });
  });
});
```

`tests/unit/prefs.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createMotionPrefs, supportsWebGL } from '../../src/motion/prefs';

function fakeHost(initial: boolean, forcedColors = false) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const query = {
    matches: initial,
    addEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.delete(l),
  };
  return {
    host: {
      matchMedia: (q: string) =>
        (q.includes('forced-colors') ? { matches: forcedColors } : query) as unknown as MediaQueryList,
    },
    emit(matches: boolean) {
      query.matches = matches;
      for (const l of listeners) l({ matches });
    },
    count: () => listeners.size,
  };
}

describe('createMotionPrefs', () => {
  it('reports the current preference and notifies changes', () => {
    const fake = fakeHost(false);
    const prefs = createMotionPrefs(fake.host);
    const listener = vi.fn();
    const off = prefs.onChange(listener);
    expect(prefs.reduced()).toBe(false);
    fake.emit(true);
    expect(listener).toHaveBeenCalledWith(true);
    expect(prefs.reduced()).toBe(true);
    off();
    expect(fake.count()).toBe(0);
  });
});

describe('forced colours', () => {
  it('counts as reduced motion', () => {
    const fake = fakeHost(false, true);
    expect(createMotionPrefs(fake.host).reduced()).toBe(true);
  });
  it('keeps effects off when reduced motion is turned off but forced colours stay on', () => {
    const fake = fakeHost(true, true);
    const prefs = createMotionPrefs(fake.host);
    const listener = vi.fn();
    prefs.onChange(listener);
    fake.emit(false);
    expect(listener).toHaveBeenCalledWith(true);
  });
});

describe('supportsWebGL', () => {
  const docWith = (ctx: unknown) => ({
    createElement: () => ({ getContext: () => ctx }) as unknown as HTMLCanvasElement,
  });
  it('is true when a context is returned', () => {
    expect(supportsWebGL(docWith({}))).toBe(true);
  });
  it('is false when no context is available', () => {
    expect(supportsWebGL(docWith(null))).toBe(false);
  });
  it('is false when getContext throws', () => {
    const doc = {
      createElement: () =>
        ({
          getContext: () => {
            throw new Error('blocked');
          },
        }) as unknown as HTMLCanvasElement,
    };
    expect(supportsWebGL(doc)).toBe(false);
  });
});
```

`tests/unit/ink-easing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { easeInOut, tweenValue } from '../../src/gl/ink/ink-easing';

describe('easeInOut', () => {
  it('starts at 0, ends at 1 and is symmetric around 0.5', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(0.25) + easeInOut(0.75)).toBeCloseTo(1);
  });
  it('clamps outside [0, 1]', () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});

describe('tweenValue', () => {
  it('interpolates between from and to', () => {
    expect(tweenValue(1, 0, 0, 250)).toBe(1);
    expect(tweenValue(1, 0, 250, 250)).toBe(0);
    expect(tweenValue(0, 1, 125, 250)).toBeCloseTo(0.5);
  });
  it('jumps to the end when duration is not positive', () => {
    expect(tweenValue(0, 1, 0, 0)).toBe(1);
  });
});
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:unit`
Esperado: FAIL nos três ficheiros novos (módulos inexistentes).

- [ ] **Passo 3: Implementar**

`src/motion/math.ts`:

```ts
export interface Vec2 {
  x: number;
  y: number;
}

export function lerp2(current: Vec2, target: Vec2, factor: number): Vec2 {
  const k = Math.min(Math.max(factor, 0), 1);
  return { x: current.x + (target.x - current.x) * k, y: current.y + (target.y - current.y) * k };
}

/** Slow Lissajous path inside [0.2, 0.8] used when there is no fine pointer. */
export function driftPosition(seconds: number): Vec2 {
  return { x: 0.5 + 0.3 * Math.sin(seconds * 0.23), y: 0.5 + 0.3 * Math.sin(seconds * 0.17 + 1.3) };
}

export function clampDpr(devicePixelRatio: number, max = 1.5): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) return 1;
  return Math.min(devicePixelRatio, max);
}

/** Converts a client pointer position to UV space (0..1, y up) for a given rect. */
export function toUv(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): Vec2 {
  const x = (clientX - rect.left) / rect.width;
  const y = 1 - (clientY - rect.top) / rect.height;
  return { x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) };
}
```

`src/motion/prefs.ts`:

```ts
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
```

`src/gl/ink/ink-easing.ts`:

```ts
/** easeInOutCubic on t ∈ [0, 1] */
export function easeInOut(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Progress value at `elapsed` ms for a tween from `from` to `to` lasting `duration` ms. */
export function tweenValue(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0) return to;
  return from + (to - from) * easeInOut(elapsed / duration);
}
```

- [ ] **Passo 4: Correr e confirmar que passam**

Correr: `npm run test:unit`
Esperado: PASS, 30 testes no total.

- [ ] **Passo 5: Commit**

```bash
git add src/motion src/gl/ink/ink-easing.ts tests/unit
git commit -m "feat(motion): utilitários de interpolação, deriva e preferências"
```

---

### Tarefa 8: Luz no hero (protótipo)

**Ficheiros:**
- Criar: `src/gl/light/light-shaders.ts`, `src/gl/light/light-scene.ts`, `src/gl/light/mount-hero-light.ts`, `src/components/HeroLight.astro`, `src/pages/lab/luz.astro`
- Testes: `tests/e2e/hero-light.spec.ts`; modificar `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Consome: `lerp2`, `driftPosition`, `clampDpr`, `toUv`, `createMotionPrefs`, `supportsWebGL` (Tarefa 7); `src/assets/photos/eu.jpg` (Tarefa 5); `Base.astro` (Tarefa 4).
- Produz:
  - `createLightScene({ canvas, image, onContextLost }): LightScene` com `setPointer(uv | null)`, `start()`, `stop()`, `destroy()`
  - `mountHeroLight(root: HTMLElement): () => void`; escreve `root.dataset.state` ∈ `'idle' | 'running' | 'paused' | 'fallback' | 'off'`
  - `HeroLight.astro` com props `{ src: ImageMetadata; alt: string }`; elemento `[data-hero-light][data-texture]` com `<img>` (via `<Picture>`) e `<canvas aria-hidden="true">`

Comportamento: a foto em `<picture>` é o conteúdo e o LCP. O efeito arranca em idle, carrega `light-scene` por import dinâmico (chunk separado, contado como WebGL) e faz fade-in do canvas. Com `uIntensity = 0`, o shader reproduz exatamente a foto, por isso a entrada não salta. Com ponteiro fino, a luz segue o cursor com inércia (0,08). Sem ponteiro fino, deriva sozinha. Pausa fora do ecrã e com o separador em segundo plano. Reduced motion ou cores forçadas: `off`. Sem WebGL, falha da textura ou perda de contexto: `fallback`.

- [ ] **Passo 1: Escrever os testes que falham**

`tests/e2e/hero-light.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

const hero = (page: Page) => page.locator('[data-hero-light]');

test('static image is visible before any script and the canvas is hidden from AT', async ({ page }) => {
  await page.goto('/lab/luz/', { waitUntil: 'domcontentloaded' });
  await expect(hero(page).locator('img')).toBeVisible();
  await expect(hero(page).locator('img')).toHaveAttribute('alt', /Gonçalo Guerra/);
  await expect(hero(page).locator('canvas')).toHaveAttribute('aria-hidden', 'true');
});

test('effect starts when WebGL is available', async ({ page }) => {
  await page.goto('/lab/luz/');
  await expect(hero(page)).toHaveAttribute('data-state', 'running', { timeout: 10_000 });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('stays a static photo', async ({ page }) => {
    await page.goto('/lab/luz/');
    await expect(hero(page)).toHaveAttribute('data-state', 'off', { timeout: 5_000 });
    await expect(hero(page).locator('canvas')).toHaveCSS('opacity', '0');
  });
});

test.describe('with forced colours', () => {
  test.use({ forcedColors: 'active' });
  test('stays a static photo', async ({ page }) => {
    await page.goto('/lab/luz/');
    await expect(hero(page)).toHaveAttribute('data-state', 'off', { timeout: 5_000 });
  });
});

test('falls back to the photo when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error -- test override returns null for WebGL contexts only
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return original.call(this, type, ...rest);
    };
  });
  await page.goto('/lab/luz/');
  await expect(hero(page)).toHaveAttribute('data-state', 'fallback', { timeout: 5_000 });
  await expect(hero(page).locator('img')).toBeVisible();
});

test('falls back without uncaught errors when the texture fails to load', async ({ page }) => {
  await page.goto('/lab/luz/');
  const textureUrl = await hero(page).getAttribute('data-texture');
  expect(textureUrl).toBeTruthy();
  await page.route(`**${textureUrl}`, (route) => route.fulfill({ status: 404 }));
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.reload();
  await expect(hero(page)).toHaveAttribute('data-state', 'fallback', { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('falls back when the WebGL context is lost', async ({ page }) => {
  await page.goto('/lab/luz/');
  await expect(hero(page)).toHaveAttribute('data-state', 'running', { timeout: 10_000 });
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-light] canvas');
    const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(hero(page)).toHaveAttribute('data-state', 'fallback');
  await expect(hero(page).locator('img')).toBeVisible();
});

test('canvas follows viewport size changes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/lab/luz/');
  await expect(hero(page)).toHaveAttribute('data-state', 'running', { timeout: 10_000 });
  const canvas = hero(page).locator('canvas');
  const before = await canvas.evaluate((c: HTMLCanvasElement) => c.width);
  await page.setViewportSize({ width: 600, height: 800 });
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.width)).not.toBe(before);
});
```

Em `tests/e2e/a11y.spec.ts`, substituir a linha `const pages = …` por:

```ts
const pages = ['/pt/', '/en/', '/nao-existe/', '/lab/tipografia/', '/lab/luz/'];
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:e2e -- hero-light a11y`
Esperado: FAIL — `/lab/luz/` não existe.

- [ ] **Passo 3: Shaders e cena**

`src/gl/light/light-shaders.ts`:

```ts
export const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uPointer;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

vec2 coverUv(vec2 uv) {
  float canvasRatio = uResolution.x / uResolution.y;
  float imageRatio = uImageSize.x / uImageSize.y;
  vec2 scale = canvasRatio > imageRatio
    ? vec2(1.0, imageRatio / canvasRatio)
    : vec2(canvasRatio / imageRatio, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 base = texture2D(uImage, coverUv(vUv)).rgb;
  float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  float d = distance(vUv * aspect, uPointer * aspect);
  float light = smoothstep(0.55, 0.0, d);
  // uIntensity = 0 reproduces the static image exactly (exposure 1.0)
  float exposure = mix(1.0, mix(0.55, 1.35, light), uIntensity);
  float grain = (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.08 * uIntensity;
  gl_FragColor = vec4(vec3(clamp(lum * exposure + grain, 0.0, 1.0)), 1.0);
}
`;
```

`src/gl/light/light-scene.ts`:

```ts
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { clampDpr, driftPosition, lerp2, type Vec2 } from '../../motion/math';
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
}

export function createLightScene({ canvas, image, onContextLost }: LightSceneOptions): LightScene {
  const renderer = new Renderer({
    canvas,
    dpr: clampDpr(window.devicePixelRatio),
    alpha: false,
    antialias: false,
  });
  const gl = renderer.gl;
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
```

- [ ] **Passo 4: Montagem e componente**

`src/gl/light/mount-hero-light.ts`:

```ts
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

  const start = async () => {
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
```

`src/components/HeroLight.astro`:

```astro
---
import type { ImageMetadata } from 'astro';
import { getImage, Picture } from 'astro:assets';

interface Props {
  src: ImageMetadata;
  alt: string;
}

const { src, alt } = Astro.props;
const texture = await getImage({ src, width: 1280, format: 'webp' });
---

<figure class="hero-light" data-hero-light data-texture={texture.src} data-state="idle">
  <Picture
    src={src}
    alt={alt}
    widths={[640, 960, 1280, 1600]}
    sizes="(min-width: 60rem) 60vw, 100vw"
    formats={['avif', 'webp']}
    loading="eager"
    fetchpriority="high"
    class="hero-light__img"
  />
  <canvas class="hero-light__canvas" aria-hidden="true"></canvas>
</figure>

<style>
  .hero-light {
    position: relative;
    overflow: hidden;
    background: var(--ink);
  }
  .hero-light__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1);
  }
  .hero-light__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity var(--t-slow) var(--ease-out);
  }
  .hero-light[data-state='running'] .hero-light__canvas,
  .hero-light[data-state='paused'] .hero-light__canvas {
    opacity: 1;
  }
</style>

<script>
  import { mountHeroLight } from '../gl/light/mount-hero-light';

  let cleanups: Array<() => void> = [];
  document.addEventListener('astro:page-load', () => {
    cleanups = [...document.querySelectorAll<HTMLElement>('[data-hero-light]')].map(mountHeroLight);
  });
  document.addEventListener('astro:before-swap', () => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
  });
</script>
```

- [ ] **Passo 5: Página de laboratório**

`src/pages/lab/luz.astro`. Nesta tarefa **sem** o link para a tinta, que entra na Tarefa 9:

```astro
---
import eu from '../../assets/photos/eu.jpg';
import HeroLight from '../../components/HeroLight.astro';
import Base from '../../layouts/Base.astro';
---

<Base title="Lab · Luz" description="Protótipo do efeito de luz" noindex surface="ink">
  <section class="lab">
    <p class="label">Lab · Luz</p>
    <HeroLight src={eu} alt="Retrato de Gonçalo Guerra a preto e branco, em contraluz." />
  </section>
</Base>

<style>
  .lab {
    display: grid;
    gap: var(--space-6);
    padding: var(--space-8);
  }
  .lab :global(.hero-light) {
    height: min(80vh, 60rem);
  }
</style>
```

- [ ] **Passo 6: Correr e confirmar que passam**

```bash
npm run check
npm run test:e2e -- hero-light a11y
npm run build && npm run budget
```

Esperado: 0 erros; todos os testes PASS; orçamento cumprido (no teste: cerca de 16 KB WebGL).

Se `effect starts when WebGL is available` falhar só em headless por falta de WebGL, confirmar que os argumentos SwiftShader do `playwright.config.ts` estão ativos antes de mexer no código.

- [ ] **Passo 7: Verificação visual**

Abrir `npm run dev` → `/lab/luz/`. A entrada não pode ter salto visível entre a foto e o canvas. A luz segue o rato com inércia e deriva sozinha no telemóvel. Ativar "reduzir movimento" no sistema: fica só a foto, sem recarregar a página.

- [ ] **Passo 8: Commit**

```bash
git add src/gl/light src/components/HeroLight.astro src/pages/lab/luz.astro tests/e2e
git commit -m "feat(lab): protótipo da luz no hero com fallbacks"
```

---

### Tarefa 9: Transição de tinta (protótipo)

**Ficheiros:**
- Criar: `src/gl/ink/ink-shaders.ts`, `src/gl/ink/ink-overlay.ts`, `src/components/InkTransition.astro`, `src/pages/lab/tinta-a.astro`, `src/pages/lab/tinta-b.astro`
- Modificar: `src/layouts/Base.astro`, `src/pages/lab/luz.astro`, `tests/e2e/a11y.spec.ts`
- Teste: `tests/e2e/ink.spec.ts`

**Interfaces:**
- Consome: `tweenValue` (Tarefa 7), `clampDpr`, `createMotionPrefs`, `supportsWebGL` (Tarefa 7); eventos `astro:before-preparation` (com `loader`, `direction`, `signal`) e `astro:after-swap` do ClientRouter.
- Produz:
  - `createInkOverlay(canvas): InkOverlay` com `play(to: 0 | 1, direction: 1 | -1, durationMs): Promise<void>`, `setColor(rgb)`, `destroy()`
  - `canvas[data-ink].dataset.state` ∈ `'idle' | 'covering' | 'covered' | 'uncovering'`

Comportamento: ao navegar, a tinta cobre (250 ms) **em paralelo** com o carregamento da página seguinte (o `loader` original não espera pela animação). Depois da troca, descobre (250 ms). Total de animação: 500 ms, dentro dos 450–600 ms da especificação. Uma nova `play()` cancela a anterior (`token`). Se a navegação for abortada, a tinta descobre. O canvas é `transition:persist`, por isso sobrevive às trocas de página. Reduced motion ou sem WebGL: o overlay nunca é usado e fica o crossfade de 150 ms do `base.css`.

- [ ] **Passo 1: Escrever os testes que falham**

`tests/e2e/ink.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const ink = '[data-ink]';

test('navigates between pages and the ink ends uncovered', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await page.getByRole('link', { name: 'Ir para tinta B' }).click();
  await expect(page).toHaveURL(/\/lab\/tinta-b\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta B');
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: 2_000 });
});

test('overlay never blocks the page', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await expect(page.locator(ink)).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator(ink)).toHaveCSS('pointer-events', 'none');
});

test('back navigation works and leaves the ink uncovered', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await page.getByRole('link', { name: 'Ir para tinta B' }).click();
  await expect(page).toHaveURL(/tinta-b/);
  await page.goBack();
  await expect(page).toHaveURL(/tinta-a/);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: 2_000 });
});

test('rapid successive navigations do not leave the ink stuck', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await page.getByRole('link', { name: 'Ir para tinta B' }).click({ noWaitAfter: true });
  await page.getByRole('link', { name: 'Ir para luz' }).click({ noWaitAfter: true });
  await expect(page).toHaveURL(/\/lab\/(luz|tinta-b)\/$/);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: 3_000 });
});

test('keyboard navigation announces the new page', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await page.getByRole('link', { name: 'Ir para tinta B' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/tinta-b/);
  await expect(page.locator('.astro-route-announcer').last()).toHaveText('Lab · Tinta B');
});

test('the whole transition completes within 1.5 s locally', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  const started = Date.now();
  await page.getByRole('link', { name: 'Ir para tinta B' }).click();
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: 2_000 });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta B');
  expect(Date.now() - started).toBeLessThan(1_500);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the ink overlay is never used', async ({ page }) => {
    await page.goto('/lab/tinta-a/');
    const states: string[] = [];
    await page.exposeFunction('recordInkState', (state: string) => states.push(state));
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-ink]');
      if (!canvas) return;
      new MutationObserver(() =>
        (window as unknown as { recordInkState(s: string): void }).recordInkState(
          canvas.getAttribute('data-state') ?? '',
        ),
      ).observe(canvas, { attributes: true, attributeFilter: ['data-state'] });
    });
    await page.getByRole('link', { name: 'Ir para tinta B' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta B');
    expect(states.filter((s) => s !== 'idle')).toEqual([]);
  });
});
```

Em `tests/e2e/a11y.spec.ts`, substituir a linha `const pages = …` pela lista final:

```ts
const pages = [
  '/pt/',
  '/en/',
  '/nao-existe/',
  '/lab/tipografia/',
  '/lab/luz/',
  '/lab/tinta-a/',
  '/lab/tinta-b/',
];
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:e2e -- ink a11y`
Esperado: FAIL — as páginas de tinta não existem.

- [ ] **Passo 3: Shaders e overlay**

`src/gl/ink/ink-shaders.ts`:

```ts
export const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const fragment = /* glsl */ `
precision highp float;
uniform float uProgress;
uniform float uDirection;
uniform float uSeed;
uniform vec3 uColor;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float gradient = uDirection > 0.0 ? vUv.x : 1.0 - vUv.x;
  float field = gradient * 0.6 + fbm(vUv * 3.0 + uSeed) * 0.4;
  float edge = uProgress * 1.2 - 0.1;
  float alpha = 1.0 - smoothstep(edge - 0.04, edge + 0.04, field);
  gl_FragColor = vec4(uColor * alpha, alpha);
}
`;
```

`src/gl/ink/ink-overlay.ts`:

```ts
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
```

- [ ] **Passo 4: Componente e ligação ao layout**

`src/components/InkTransition.astro`:

```astro
<canvas class="ink" data-ink data-state="idle" aria-hidden="true" transition:persist="ink-overlay"></canvas>

<style>
  .ink {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1000;
  }
</style>

<script>
  import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
  import type { InkOverlay } from '../gl/ink/ink-overlay';
  import { createMotionPrefs, supportsWebGL } from '../motion/prefs';

  const COVER_MS = 250;
  const UNCOVER_MS = 250;
  const prefs = createMotionPrefs(window);
  let overlay: Promise<InkOverlay | null> | null = null;
  let direction: 1 | -1 = 1;

  function getOverlay(): Promise<InkOverlay | null> {
    overlay ??= (async () => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-ink]');
      if (canvas === null || !supportsWebGL(document)) return null;
      const { createInkOverlay } = await import('../gl/ink/ink-overlay');
      return createInkOverlay(canvas);
    })().catch(() => null);
    return overlay;
  }

  document.addEventListener('astro:before-preparation', (event) => {
    const prep = event as TransitionBeforePreparationEvent;
    if (prefs.reduced()) return;
    direction = prep.direction === 'back' ? -1 : 1;
    const originalLoader = prep.loader;
    prep.signal.addEventListener('abort', () => {
      void getOverlay().then((ink) => ink?.play(0, direction, UNCOVER_MS));
    });
    prep.loader = async () => {
      const ink = await getOverlay();
      await Promise.all([originalLoader(), ink?.play(1, direction, COVER_MS)]);
    };
  });

  document.addEventListener('astro:after-swap', () => {
    if (prefs.reduced()) return;
    void getOverlay().then((ink) => ink?.play(0, direction, UNCOVER_MS));
  });
</script>
```

Em `src/layouts/Base.astro`, acrescentar o import a seguir ao `import { ClientRouter } …`:

```astro
import InkTransition from '../components/InkTransition.astro';
```

E, dentro de `<body>`, logo a seguir ao `</main>`:

```astro
    <InkTransition />
```

- [ ] **Passo 5: Páginas de laboratório**

`src/pages/lab/tinta-a.astro`:

```astro
---
import Base from '../../layouts/Base.astro';
---

<Base title="Lab · Tinta A" description="Protótipo da transição de tinta" noindex surface="paper">
  <section class="lab">
    <p class="label">Lab · Tinta A</p>
    <h1>Tinta A</h1>
    <p>
      <a href="/lab/tinta-b/">Ir para tinta B</a>
    </p>
    <p>
      <a href="/lab/luz/">Ir para luz</a>
    </p>
  </section>
</Base>

<style>
  .lab {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-8);
  }
</style>
```

`src/pages/lab/tinta-b.astro`:

```astro
---
import Base from '../../layouts/Base.astro';
---

<Base title="Lab · Tinta B" description="Protótipo da transição de tinta" noindex surface="ink">
  <section class="lab">
    <p class="label">Lab · Tinta B</p>
    <h1>Tinta B</h1>
    <p>
      <a href="/lab/tinta-a/">Ir para tinta A</a>
    </p>
    <p>
      <a href="/lab/luz/">Ir para luz</a>
    </p>
  </section>
</Base>

<style>
  .lab {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-8);
  }
</style>
```

Em `src/pages/lab/luz.astro`, acrescentar a seguir a `<HeroLight … />`:

```astro
    <p>
      <a href="/lab/tinta-a/">Ir para tinta A</a>
    </p>
```

- [ ] **Passo 6: Correr e confirmar que passam**

```bash
npm run check
npm run test:e2e
npm run build && npm run budget
```

Esperado: 0 erros; **todos** os testes end-to-end PASS (incluindo os das Tarefas 4, 5 e 8, porque o layout mudou); orçamento cumprido.

- [ ] **Passo 7: Verificação visual**

Navegar entre `/lab/tinta-a/` (papel) e `/lab/tinta-b/` (tinta), para a frente e para trás. A tinta entra no sentido da navegação e inverte no "voltar". Clicar duas vezes seguidas não deixa a página tapada. Com "reduzir movimento", só há crossfade.

- [ ] **Passo 8: Commit**

```bash
git add src/gl/ink src/components/InkTransition.astro src/layouts/Base.astro src/pages/lab tests/e2e
git commit -m "feat(lab): protótipo da transição de tinta integrada no ClientRouter"
```

---

### Tarefa 10: Gate da fase 2

**Ficheiros:**
- Criar: `docs/gates/fase-2.md`

Este gate decide se os efeitos entram no site como estão, se precisam de ajustes, ou se ficam fora (a especificação diz que os efeitos só entram se cumprirem o orçamento).

- [ ] **Passo 1: Verificação automática completa**

```bash
npm ci
npm run check && npm run lint && npm run format:check
npm run test:unit
npm run build && npm run budget
npm run test:e2e
npx @lhci/cli@0.15.1 autorun
```

Esperado: tudo verde. Lighthouse ≥ 95 em `/pt/` e `/lab/luz/`; LCP ≤ 2,0 s; CLS ≤ 0,05; TBT ≤ 150 ms.

- [ ] **Passo 2: Medição manual de fluidez**

No Chrome DevTools → Performance, com CPU 4× mais lenta, gravar 10 s em `/lab/luz/` a mexer o rato e 5 navegações entre as páginas de tinta. Registar a taxa de frames e qualquer long task acima de 50 ms. Repetir num telemóvel real (Android ou iPhone), com a luz em deriva.

- [ ] **Passo 3: Verificações manuais de acessibilidade**

Com VoiceOver (macOS/iOS) ou NVDA (Windows): o canvas não é anunciado, a foto tem alt, a mudança de página é anunciada. Com o modo de alto contraste do Windows (`forced-colors`): o conteúdo continua legível.

- [ ] **Passo 4: Registar o resultado**

`docs/gates/fase-2.md`, preenchido com os valores reais (não deixar campos vazios; escrever "não medido" e o motivo, se for o caso):

```markdown
# Gate da fase 2 — <data>

| Verificação | Resultado | Limite |
| --- | --- | --- |
| JS inicial (gzip) | <valor> KB | ≤ 30 KB |
| JS WebGL (gzip) | <valor> KB | ≤ 40 KB |
| Lighthouse /pt/ (perf / a11y / bp) | <valores> | ≥ 95 |
| Lighthouse /lab/luz/ (perf / a11y / bp) | <valores> | ≥ 95 |
| LCP /lab/luz/ | <valor> s | ≤ 2,0 s |
| CLS | <valor> | ≤ 0,05 |
| Fluidez luz, CPU 4× | <fps>, long tasks: <n> | sem quebras visíveis |
| Fluidez tinta, CPU 4× | <fps>, long tasks: <n> | sem quebras visíveis |
| Telemóvel real (<modelo>) | <observação> | — |
| Leitor de ecrã | <observação> | canvas não anunciado |

Decisão: ✅ avançar / ⚠️ ajustar (<o quê>) / ❌ retirar efeito (<qual>)
```

- [ ] **Passo 5: Commit e revisão**

```bash
git add docs/gates/fase-2.md
git commit -m "docs: resultado do gate da fase 2"
```

Rever o resultado com o Gonçalo antes de escrever o plano das fases 3 a 5.
