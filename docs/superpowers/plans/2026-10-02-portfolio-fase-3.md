# Portfolio — Fase 3 (Páginas base) — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa a tarefa. Os passos usam checkboxes (`- [ ]`) para acompanhamento.

**Objetivo:** Substituir as páginas provisórias pelas páginas reais do portfolio — Início com a luz no hero, Trabalho, Sobre, rodapé de contacto em todas as páginas e 404 — com os textos PT/EN aprovados pelo Gonçalo.

**Arquitetura:** Um layout `Page` envolve o `Base` com cabeçalho e rodapé. Os textos longos vivem em `src/i18n/copy.ts` (tipados, com teste de paridade PT/EN); os textos curtos de interface continuam em `src/i18n/ui.ts`. Os projetos são uma coleção de conteúdo (`src/content/work/<locale>/<slug>.md`) que a fase 4 vai estender com o case study. As duas secções com slug traduzido (trabalho/work, sobre/about) saem de um único ficheiro `src/pages/[lang]/[page].astro`.

**Tech stack:** a mesma das fases 1–2 (Astro 7.3.5, TypeScript 6.0.3, OGL, Vitest, Playwright + axe, Lighthouse CI). Sem dependências novas.

**Ponto de partida:** `main` em `e5d9829` (gate da fase 2). **Especificação:** `docs/especificacao.md`.

**Estado da verificação:** construído e verificado sobre `e5d9829` num ambiente com Chromium: `astro check` 0 erros, ESLint e Prettier limpos, 84 testes unitários, 63/64 e2e (o que falha é `the light stops after its entrance…`, já existente e sensível ao tempo em máquinas sem GPU; passa no CI), orçamento de JS 9,6 KB inicial / 16,4 KB WebGL, sem overflow horizontal a 360 px. Lighthouse sem WebGL (para isolar o ambiente): Trabalho e Sobre com performance 100 e LCP 1,2–1,5 s; Início com 97–100 e LCP 1,66–1,82 s. Com WebGL em software, este ambiente dá TBT de vários segundos também em `/lab/luz/`, que no CI passa: **o CI é a referência**. A margem do LCP do Início (~200 ms) é mais curta do que a de `/lab/luz/`; a Tarefa 6 diz o que fazer se o CI a ultrapassar.

## Restrições globais

- Textos: os do Início e do Sobre foram aprovados pelo Gonçalo a 2026-10-02 e entram **exatamente** como estão em `copy.ts`. Não reescrever, não acrescentar frases. Os resumos dos projetos, as listas de ferramentas e os níveis de línguas foram confirmados à parte (ver Tarefa 1).
- Redes no rodapé: só LinkedIn e Instagram (escolha do Gonçalo). Sem GitHub nem Facebook no rodapé. Sem CV por agora.
- Nenhum facto inventado: sem métricas, clientes ou resultados. O case study do DonGonçalo é a fase 4; aqui o projeto aparece com o estado "Case study em preparação" e sem link próprio.
- Monocromático: nenhuma cor de projeto nestas páginas (a regra "a cor pertence ao trabalho" entra na fase 4).
- Acessibilidade: WCAG 2.2 AA verificado com axe em todas as páginas; `aria-current="page"` na navegação; links externos com `target="_blank"`, `rel="noopener noreferrer"` e aviso para leitores de ecrã; alvos de toque com pelo menos 44 px nos botões.
- Performance: orçamentos e asserções do Lighthouse inalterados (LCP ≤ 2,0 s, CLS ≤ 0,05, TBT ≤ 150 ms, ≥ 95). Não subir limites.
- Layout: grelha de 12 colunas a partir de 64rem; uma coluna abaixo. Sem overflow horizontal a 360 px.
- Push: só com OK do Gonçalo dado na própria conversa, ou feito por ele no GitHub Desktop.

## Foco de revisão

1. **Endereço de email comprido no telemóvel:** a 360 px tem de caber numa linha, sem partir a meio. Teste `at 360 px wide` (Tarefa 6) e verificação visual.
2. **Navegação com o ClientRouter:** o rodapé é trocado em cada navegação; o botão de copiar tem de continuar a funcionar depois de navegar. O listener é delegado no `document` (Tarefa 4).
3. **Clipboard indisponível** (permissão negada, contexto não seguro): o botão não pode partir nem mostrar "copiado" falso; o link `mailto:` ao lado continua a servir. Tratado no `catch` (Tarefa 4).
4. **Troca de idioma em páginas com slug traduzido:** `/pt/sobre/` ↔ `/en/about/` e `/pt/trabalho/` ↔ `/en/work/`. Teste `the language switch keeps the section` (Tarefa 5).
5. **Foto do Sobre:** o Astro escreve `width`/`height` na imagem; sem `height: auto` o `aspect-ratio` é ignorado e a foto fica enorme e ampliada no telemóvel. A grelha precisa de um `<figure>` como item (a classe do `<Picture>` vai para o `<img>`). Tarefa 5.

---

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
| --- | --- |
| `src/data/contact.ts` | Email, telefone e redes públicas |
| `src/i18n/copy.ts` | Textos longos aprovados (Início, Sobre) por idioma |
| `src/i18n/ui.ts` | Textos curtos de interface (navegação, rodapé, Trabalho) |
| `src/i18n/work.ts` | Leitura da coleção de projetos por idioma e slug |
| `src/content.config.ts`, `src/content/work/*/*.md` | Coleção de projetos (metadados; o corpo do case study é da fase 4) |
| `src/components/SiteHeader.astro` | Nome, navegação com `aria-current`, troca de idioma |
| `src/components/SiteFooter.astro` | Contacto: email com copiar, telefone, redes |
| `src/layouts/Page.astro` | `Base` + cabeçalho + rodapé |
| `src/pages/[lang]/index.astro` | Início |
| `src/pages/[lang]/[page].astro` | Trabalho e Sobre |
| `src/pages/404.astro` | 404 bilingue |

---

### Tarefa 1: Textos, contactos e dicionário

**Ficheiros:**
- Criar: `src/data/contact.ts`, `src/i18n/copy.ts`
- Modificar: `src/i18n/ui.ts` (substituir pelo conteúdo abaixo)
- Teste: `tests/unit/copy.test.ts`

**Interfaces:**
- Produz:
  - `contact: { email; phone: { display; href }; social: { name; href }[] }`
  - `interface PageCopy { home: {…}; about: {…} }`, `copy: Record<Locale, PageCopy>`
  - novas chaves em `ui`: `nav.label`, `work.*`, `about.description`, `footer.*`, `notFound.title`

- [ ] **Passo 0: Confirmar conteúdo com o Gonçalo (decisão humana)**

Antes de escrever, mostrar-lhe e obter OK para: as listas de ferramentas por grupo e os níveis de línguas em `copy.ts` (derivados do CV: Português nativo, Inglês avançado, Espanhol básico, Japonês iniciação), e os resumos dos dois projetos (Tarefa 3). Se ele mudar alguma coisa, aplicar nos dois idiomas.

- [ ] **Passo 1: Escrever o teste que falha**

`tests/unit/copy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { copy } from '../../src/i18n/copy';

/** Replaces every string with a marker, so two locales can be compared by shape only. */
function shape(value: unknown): unknown {
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return value.map(shape);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]));
  }
  return value;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('page copy', () => {
  it('has the same structure in PT and EN (keys, paragraphs, tool groups, items, languages)', () => {
    expect(shape(copy.en)).toEqual(shape(copy.pt));
  });

  it('has no empty strings', () => {
    for (const value of [...strings(copy.pt), ...strings(copy.en)]) expect(value.trim()).not.toBe('');
  });

  it('uses the same tool names in both languages, apart from the design group', () => {
    const technical = (locale: 'pt' | 'en') =>
      copy[locale].about.tools.slice(0, 4).map((group) => group.items);
    expect(technical('en')).toEqual(technical('pt'));
  });
});
```

- [ ] **Passo 2: Correr e confirmar que falha**

Correr: `npm run test:unit -- copy`
Esperado: FAIL — `src/i18n/copy` não existe.

- [ ] **Passo 3: Implementar**

`src/data/contact.ts`:

```ts
/** Public contact details (spec: Contacto). Social links are the ones chosen by Gonçalo: LinkedIn and Instagram. */
export const contact = {
  email: 'goncaloguerra100@gmail.com',
  phone: { display: '+351 911 549 616', href: 'tel:+351911549616' },
  social: [
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/gon%C3%A7alo-guerra-12b184341/' },
    { name: 'Instagram', href: 'https://www.instagram.com/goncalo_guerra78/' },
  ],
} as const;
```

`src/i18n/copy.ts`:

```ts
import type { Locale } from './config';

/** Long-form page copy approved by Gonçalo on 2026-10-02 (Início and Sobre). */
export interface PageCopy {
  home: {
    kicker: string;
    title: string;
    lead: string;
    photoAlt: string;
    featuredLabel: string;
    featuredTitle: string;
    featuredText: string;
    featuredLink: string;
    aboutLink: string;
  };
  about: {
    title: string;
    photoAlt: string;
    paragraphs: readonly string[];
    toolsTitle: string;
    tools: readonly { group: string; items: readonly string[] }[];
    languagesTitle: string;
    languages: readonly { name: string; level: string }[];
  };
}

export const copy: Record<Locale, PageCopy> = {
  pt: {
    home: {
      kicker: 'Designer e developer web · Sever do Vouga, Portugal',
      title: 'Desenho e construo produtos digitais, do primeiro esboço ao deploy.',
      lead: 'Antes de escrever código, gosto de perceber como o problema funciona por dentro.',
      photoAlt: 'Retrato de Gonçalo Guerra a preto e branco, em contraluz.',
      featuredLabel: 'Trabalho em destaque',
      featuredTitle: 'Don Gonçalo — da cozinha ao código.',
      featuredText:
        'Fui pizzaiolo no restaurante; depois desenhei e construí a plataforma dele: carta digital, pratos do dia, reservas e backoffice.',
      featuredLink: 'Ver trabalho',
      aboutLink: 'Sobre mim',
    },
    about: {
      title: 'Sobre',
      photoAlt: 'Gonçalo Guerra a preto e branco, em contraluz, de cabeça inclinada para baixo.',
      paragraphs: [
        'Sou o Gonçalo, designer e developer web, licenciado em Tecnologias e Design de Multimédia pela ESTG de Viseu.',
        'Antes do código, trabalhei em restauração, como empregado de mesa, ajudante de cozinha e sobretudo pizzaiolo, e numa carpintaria, a operar uma máquina CNC. Da cozinha trouxe o ritmo e a atenção a quem está do outro lado. Da CNC, a precisão de transformar instruções digitais em coisas reais.',
        'Hoje desenho e desenvolvo produtos web de ponta a ponta, da interface ao backend e ao deploy. A fotografia e o design gráfico continuam a ser a forma como olho para tudo o resto.',
        'Estou aberto a oportunidades em equipa e a projetos freelance.',
      ],
      toolsTitle: 'Ferramentas',
      tools: [
        { group: 'Frontend', items: ['HTML', 'CSS', 'TypeScript', 'React', 'Astro', 'Tailwind CSS', 'Vite'] },
        { group: 'Backend', items: ['Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Zod'] },
        { group: 'Deploy', items: ['Vercel', 'Railway', 'Neon', 'Cloudflare'] },
        { group: 'Criativo', items: ['WebGL (OGL)', 'Unity'] },
        {
          group: 'Design e imagem',
          items: ['Illustrator', 'Photoshop', 'Premiere', 'Fotografia', 'Motion graphics'],
        },
      ],
      languagesTitle: 'Línguas',
      languages: [
        { name: 'Português', level: 'nativo' },
        { name: 'Inglês', level: 'avançado' },
        { name: 'Espanhol', level: 'básico' },
        { name: 'Japonês', level: 'iniciação' },
      ],
    },
  },
  en: {
    home: {
      kicker: 'Web designer and developer · Sever do Vouga, Portugal',
      title: 'I design and build digital products, from first sketch to deploy.',
      lead: 'Before writing code, I like to understand how the problem works from the inside.',
      photoAlt: 'Portrait of Gonçalo Guerra in black and white, backlit.',
      featuredLabel: 'Featured work',
      featuredTitle: 'Don Gonçalo — from kitchen to code.',
      featuredText:
        "I was the restaurant's pizzaiolo; then I designed and built its platform: digital menu, daily dishes, reservations and back office.",
      featuredLink: 'See work',
      aboutLink: 'About me',
    },
    about: {
      title: 'About',
      photoAlt: 'Gonçalo Guerra in black and white, backlit, head tilted down.',
      paragraphs: [
        "I'm Gonçalo, a web designer and developer with a degree in Multimedia Technologies and Design from ESTG Viseu.",
        'Before code, I worked in restaurants, as a waiter, kitchen assistant and above all as a pizzaiolo, and in a carpentry shop, running a CNC machine. The kitchen taught me pace and attention to the person on the other side. The CNC taught me the precision of turning digital instructions into real things.',
        'Today I design and build web products end to end, from interface to backend and deploy. Photography and graphic design are still how I look at everything else.',
        "I'm open to team roles and freelance projects.",
      ],
      toolsTitle: 'Tools',
      tools: [
        { group: 'Frontend', items: ['HTML', 'CSS', 'TypeScript', 'React', 'Astro', 'Tailwind CSS', 'Vite'] },
        { group: 'Backend', items: ['Node.js', 'Express', 'Prisma', 'PostgreSQL', 'Zod'] },
        { group: 'Deploy', items: ['Vercel', 'Railway', 'Neon', 'Cloudflare'] },
        { group: 'Creative', items: ['WebGL (OGL)', 'Unity'] },
        {
          group: 'Design and image',
          items: ['Illustrator', 'Photoshop', 'Premiere', 'Photography', 'Motion graphics'],
        },
      ],
      languagesTitle: 'Languages',
      languages: [
        { name: 'Portuguese', level: 'native' },
        { name: 'English', level: 'advanced' },
        { name: 'Spanish', level: 'basic' },
        { name: 'Japanese', level: 'beginner' },
      ],
    },
  },
};
```

`src/i18n/ui.ts` (ficheiro completo):

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
    'hero.tiltHint': 'Toca para mover a luz',
    'nav.label': 'Principal',
    'work.title': 'Trabalho',
    'work.description': 'Projetos de Gonçalo Guerra: produto, web e motion.',
    'work.year': 'Ano',
    'work.disciplines': 'Disciplinas',
    'work.role': 'Papel',
    'work.status.inPreparation': 'Case study em preparação',
    'about.description': 'Sobre Gonçalo Guerra, designer e developer web em Sever do Vouga, Portugal.',
    'footer.contact': 'Contacto',
    'footer.email': 'Email',
    'footer.phone': 'Telefone',
    'footer.copy': 'Copiar email',
    'footer.copied': 'Email copiado',
    'footer.elsewhere': 'Noutros sítios',
    'footer.opensNewTab': '(abre num novo separador)',
    'notFound.title': 'Página não encontrada',
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
    'hero.tiltHint': 'Tap to move the light',
    'nav.label': 'Main',
    'work.title': 'Work',
    'work.description': 'Projects by Gonçalo Guerra: product, web and motion.',
    'work.year': 'Year',
    'work.disciplines': 'Disciplines',
    'work.role': 'Role',
    'work.status.inPreparation': 'Case study in preparation',
    'about.description': 'About Gonçalo Guerra, web designer and developer in Sever do Vouga, Portugal.',
    'footer.contact': 'Contact',
    'footer.email': 'Email',
    'footer.phone': 'Phone',
    'footer.copy': 'Copy email',
    'footer.copied': 'Email copied',
    'footer.elsewhere': 'Elsewhere',
    'footer.opensNewTab': '(opens in a new tab)',
    'notFound.title': 'Page not found',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['pt'];

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}
```

- [ ] **Passo 4: Correr e confirmar que passa**

Correr: `npm run test:unit`
Esperado: PASS, 84 testes (os 81 anteriores + 3 de `copy.test.ts`; `ui.test.ts` continua a garantir a paridade das chaves novas).

- [ ] **Passo 5: Commit**

```bash
git add src/data src/i18n/copy.ts src/i18n/ui.ts tests/unit/copy.test.ts
git commit -m "feat(i18n): textos aprovados do Início e do Sobre, contactos e dicionário"
```

---

### Tarefa 2: Tokens de layout, utilitários e slot do rodapé

**Ficheiros:**
- Modificar: `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`

**Interfaces:**
- Produz: tokens `--gutter`, `--max-width`; classes `.wrap` (contentor com margens laterais) e `.arrow-link` (link de ação com filete que se desenha no hover/foco, conforme a tabela de motion); `<slot name="footer" />` no `Base`, fora do `<main>` (o `contentinfo` não pode estar dentro do `main`).

- [ ] **Passo 1: Tokens**

Em `src/styles/tokens.css`, a seguir a `--rule-width: 1px;` (dentro de `:root`):

```css

    --gutter: clamp(1rem, 4vw, 2.5rem);
    --max-width: 90rem;
```

- [ ] **Passo 2: Utilitários**

Em `src/styles/base.css`, imediatamente antes de `.label {`:

```css
  .wrap {
    width: 100%;
    max-width: var(--max-width);
    margin-inline: auto;
    padding-inline: var(--gutter);
  }
  .arrow-link {
    display: inline-flex;
    gap: var(--space-2);
    align-items: baseline;
    padding-block: var(--space-2);
    text-decoration: none;
    background: linear-gradient(currentColor, currentColor) left bottom / 0 var(--rule-width) no-repeat;
    transition: background-size var(--t-base) var(--ease-out);
  }
  .arrow-link:hover,
  .arrow-link:focus-visible {
    background-size: 100% var(--rule-width);
  }
```

- [ ] **Passo 3: Slot do rodapé**

Em `src/layouts/Base.astro`, a seguir a `</main>` e antes de `<InkTransition />`:

```astro
    <slot name="footer" />
```

- [ ] **Passo 4: Verificar e commit**

```bash
npm run check && npm run format:check && npm run test:unit && npm run build
git add src/styles src/layouts/Base.astro
git commit -m "feat(design): contentor, link de ação e slot do rodapé"
```

Esperado: 0 erros, formato limpo, 84 testes, build concluído.

---

### Tarefa 3: Coleção de projetos

**Ficheiros:**
- Criar: `src/content.config.ts`, `src/content/work/pt/don-goncalo.md`, `src/content/work/en/don-goncalo.md`, `src/content/work/pt/este-site.md`, `src/content/work/en/este-site.md`, `src/i18n/work.ts`

**Interfaces:**
- Produz: coleção `work` com `{ title; year; role; disciplines: string[]; summary; order; status: 'in-preparation' | 'published' }`; `getWork(locale): Promise<WorkEntry[]>` ordenado por `order`; `workSlug(entry): string`.

O schema é validado pelo Astro no build: um ficheiro com campo em falta ou `status` inválido faz o build falhar. Os testes do conteúdo renderizado ficam na Tarefa 5.

- [ ] **Passo 1: Schema e leitura**

`src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * One file per project and language: src/content/work/<locale>/<slug>.md. The slug is the same in
 * both languages, so /pt/trabalho/<slug>/ and /en/work/<slug>/ point at the same project (phase 4).
 */
const work = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    year: z.number().int().min(2000).max(2100),
    role: z.string(),
    disciplines: z.array(z.string()).min(1),
    summary: z.string(),
    order: z.number().int(),
    status: z.enum(['in-preparation', 'published']),
  }),
});

export const collections = { work };
```

`src/i18n/work.ts`:

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './config';

export type WorkEntry = CollectionEntry<'work'>;

/** The slug is the file name; the folder is the locale (src/content/work/<locale>/<slug>.md). */
export function workSlug(entry: WorkEntry): string {
  return entry.id.split('/').pop() ?? entry.id;
}

/** Projects in one language, in the order set by their `order` field. */
export async function getWork(locale: Locale): Promise<WorkEntry[]> {
  const entries = await getCollection('work', (entry) => entry.id.startsWith(`${locale}/`));
  return entries.sort((a, b) => a.data.order - b.data.order);
}
```

- [ ] **Passo 2: Conteúdo**

`src/content/work/pt/don-goncalo.md`:

```markdown
---
title: Don Gonçalo
year: 2026
role: Design e desenvolvimento
disciplines: [Produto, Web]
summary: 'Plataforma do restaurante onde fui pizzaiolo: carta digital, pratos do dia, reservas e backoffice.'
order: 1
status: in-preparation
---
```

`src/content/work/en/don-goncalo.md`:

```markdown
---
title: Don Gonçalo
year: 2026
role: Design and development
disciplines: [Product, Web]
summary: 'Platform for the restaurant where I was the pizzaiolo: digital menu, daily dishes, reservations and back office.'
order: 1
status: in-preparation
---
```

`src/content/work/pt/este-site.md`:

```markdown
---
title: Este site
year: 2026
role: Design e desenvolvimento
disciplines: [Web, Motion]
summary: 'O portfolio que estás a ver: design system, luz em WebGL e transições de tinta, feito de raiz.'
order: 2
status: in-preparation
---
```

`src/content/work/en/este-site.md`:

```markdown
---
title: This site
year: 2026
role: Design and development
disciplines: [Web, Motion]
summary: "The portfolio you're looking at: design system, WebGL light and ink transitions, built from scratch."
order: 2
status: in-preparation
---
```

- [ ] **Passo 3: Verificar que o schema protege**

```bash
npm run build
```

Esperado: build concluído. Depois, temporariamente, mudar `status: in-preparation` para `status: draft` num dos ficheiros, correr `npm run build` e confirmar que falha com um erro de validação; repor o valor.

- [ ] **Passo 4: Commit**

```bash
git add src/content.config.ts src/content src/i18n/work.ts
git commit -m "feat(conteúdo): coleção de projetos com DonGonçalo e este site"
```

---

### Tarefa 4: Cabeçalho, rodapé de contacto e Início

**Ficheiros:**
- Criar: `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/layouts/Page.astro`
- Modificar: `src/pages/[lang]/index.astro` (substituir)
- Teste: `tests/e2e/pages.spec.ts`

**Interfaces:**
- Consome: `copy`, `contact`, `t` (Tarefa 1); `.wrap`, `.arrow-link`, slot `footer` (Tarefa 2); `getWork` (Tarefa 3); `HeroLight` (fase 2).
- Produz:
  - `SiteHeader` com props `{ locale: Locale; current: RouteKey }`
  - `SiteFooter` com props `{ locale: Locale }`; botão `[data-copy-email]` e região `[data-copy-status]` (`role="status"`)
  - `Page` com props `{ title; description; locale; current: RouteKey; surface?: 'paper' | 'ink' }`

Comportamento do botão de copiar: escreve o email no clipboard, troca o rótulo para "Email copiado" e anuncia-o na região `status` durante 1,5 s. Se o clipboard falhar, não muda nada (o `mailto:` continua ao lado). O listener é delegado no `document` uma única vez, porque o rodapé é substituído em cada navegação.

- [ ] **Passo 1: Escrever os testes que falham**

`tests/e2e/pages.spec.ts` (nesta tarefa, só o Início e o rodapé; as Tarefas 5 e 6 acrescentam testes no fim do ficheiro):

```ts
import { expect, test } from '@playwright/test';

const pages = {
  pt: { home: '/pt/', work: '/pt/trabalho/', about: '/pt/sobre/' },
  en: { home: '/en/', work: '/en/work/', about: '/en/about/' },
} as const;

test('home shows the approved title, the featured project and links to work and about', async ({ page }) => {
  await page.goto(pages.pt.home);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Desenho e construo produtos digitais, do primeiro esboço ao deploy.',
  );
  await expect(page.getByRole('heading', { level: 2, name: /Don Gonçalo/ })).toBeVisible();
  await expect(page.locator('[data-hero-light] img')).toHaveAttribute('alt', /Gonçalo Guerra/);
  await page.getByRole('link', { name: 'Ver trabalho' }).click();
  await expect(page).toHaveURL(/\/pt\/trabalho\/$/);
  await page.goBack();
  await page.getByRole('link', { name: 'Sobre mim' }).click();
  await expect(page).toHaveURL(/\/pt\/sobre\/$/);
});

test('footer has email, phone and the chosen social links', async ({ page }) => {
  await page.goto(pages.pt.home);
  const footer = page.locator('footer.site-footer');
  await expect(footer.getByRole('link', { name: 'goncaloguerra100@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:goncaloguerra100@gmail.com',
  );
  await expect(footer.getByRole('link', { name: '+351 911 549 616' })).toHaveAttribute(
    'href',
    'tel:+351911549616',
  );
  for (const name of ['LinkedIn', 'Instagram']) {
    const link = footer.getByRole('link', { name: new RegExp(name) });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(footer.getByRole('link', { name: /Facebook|GitHub/ })).toHaveCount(0);
});

test('copy email puts the address on the clipboard and announces it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(pages.pt.home);
  // Located by its data attribute: its accessible name changes when it is clicked.
  const button = page.locator('[data-copy-email]');
  await expect(button).toHaveAccessibleName('Copiar email');
  await button.click();
  await expect(button).toHaveText('Email copiado');
  await expect(page.locator('[data-copy-status]')).toHaveText('Email copiado');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('goncaloguerra100@gmail.com');
  await expect(button).toHaveText('Copiar email', { timeout: 3_000 });
});
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:e2e -- pages`
Esperado: FAIL — o Início ainda é a página provisória e não há rodapé.

- [ ] **Passo 3: Componentes e layout**

`src/components/SiteHeader.astro`:

```astro
---
import type { Locale } from '../i18n/config';
import { pathFor, type RouteKey } from '../i18n/routes';
import { t } from '../i18n/ui';
import LanguageSwitch from './LanguageSwitch.astro';

interface Props {
  locale: Locale;
  /** The section the page belongs to; marks the matching link with aria-current. */
  current: RouteKey;
}

const { locale, current } = Astro.props;
const links = [
  { key: 'work', label: t(locale, 'nav.work') },
  { key: 'about', label: t(locale, 'nav.about') },
] as const;
---

<header class="site-header wrap">
  <a
    class="brand label"
    href={pathFor(locale, 'home')}
    aria-current={current === 'home' ? 'page' : undefined}
  >
    Gonçalo Guerra
  </a>
  <nav class="site-nav" aria-label={t(locale, 'nav.label')}>
    <ul role="list">
      {links.map((link) => (
        <li>
          <a
            class="label"
            href={pathFor(locale, link.key)}
            aria-current={current === link.key ? 'page' : undefined}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
  <LanguageSwitch locale={locale} />
</header>

<style>
  .site-header {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: var(--space-6);
    align-items: center;
    min-height: 3.5rem;
    border-bottom: var(--rule-width) solid var(--rule);
  }
  .brand,
  .site-nav a {
    display: inline-block;
    padding-block: var(--space-3);
    text-decoration: none;
  }
  .site-nav ul {
    display: flex;
    gap: var(--space-6);
    padding: 0;
    list-style: none;
  }
  .site-nav a {
    color: var(--fg-muted);
  }
  .site-nav a:hover,
  .site-nav a[aria-current='page'] {
    color: var(--fg);
  }
  .site-nav a[aria-current='page'] {
    text-decoration: underline;
    text-decoration-thickness: var(--rule-width);
    text-underline-offset: 0.35em;
  }
  @media (max-width: 30rem) {
    .site-header {
      grid-template-columns: 1fr auto;
      row-gap: 0;
    }
    .site-nav {
      grid-row: 2;
    }
  }
</style>
```

`src/components/SiteFooter.astro`:

```astro
---
import { contact } from '../data/contact';
import type { Locale } from '../i18n/config';
import { t } from '../i18n/ui';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
---

<footer class="site-footer" data-surface="ink" aria-labelledby="footer-title">
  <div class="wrap footer-grid">
    <h2 id="footer-title" class="label">
      {t(locale, 'footer.contact')}
    </h2>
    <div class="footer-email">
      <a class="footer-email__link" href={`mailto:${contact.email}`}>
        {contact.email}
      </a>
      <button
        type="button"
        class="footer-copy label"
        data-copy-email={contact.email}
        data-copy-label={t(locale, 'footer.copy')}
        data-copied-label={t(locale, 'footer.copied')}
      >
        {t(locale, 'footer.copy')}
      </button>
      <p class="visually-hidden" role="status" data-copy-status></p>
    </div>
    <dl class="footer-details">
      <div>
        <dt class="label">{t(locale, 'footer.phone')}</dt>
        <dd>
          <a href={contact.phone.href}>{contact.phone.display}</a>
        </dd>
      </div>
      <div>
        <dt class="label">{t(locale, 'footer.elsewhere')}</dt>
        <dd>
          <ul role="list">
            {contact.social.map((link) => (
              <li>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.name}
                  <span class="visually-hidden"> {t(locale, 'footer.opensNewTab')}</span>
                </a>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    </dl>
    <p class="footer-legal label">© 2026 Gonçalo Guerra</p>
  </div>
</footer>

<style>
  .site-footer {
    padding-block: var(--space-16) var(--space-8);
  }
  .footer-grid {
    display: grid;
    gap: var(--space-8);
  }
  .footer-email {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4) var(--space-6);
    align-items: baseline;
  }
  .footer-email__link {
    font-family: var(--font-display);
    /* Sized so the 26-character address fits on one line from 360 px up. */
    font-size: clamp(1.2rem, 5.4vw, 4rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
    overflow-wrap: anywhere;
    text-decoration-thickness: var(--rule-width);
    text-underline-offset: 0.15em;
  }
  .footer-copy {
    min-height: 2.75rem;
    padding: var(--space-2) var(--space-4);
    border: var(--rule-width) solid var(--rule);
    background: none;
    color: var(--fg);
    cursor: pointer;
  }
  .footer-copy:hover {
    border-color: var(--fg);
  }
  .footer-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8) var(--space-16);
  }
  .footer-details dt {
    color: var(--fg-muted);
    margin-bottom: var(--space-2);
  }
  .footer-details dd {
    margin: 0;
  }
  .footer-details ul {
    display: flex;
    gap: var(--space-6);
    padding: 0;
    list-style: none;
  }
  .footer-details a {
    display: inline-block;
    padding-block: var(--space-2);
  }
  .footer-legal {
    padding-top: var(--space-6);
    border-top: var(--rule-width) solid var(--rule);
    color: var(--fg-muted);
  }
</style>

<script>
  // Delegated once: the footer is replaced on every client-side navigation.
  document.addEventListener('click', async (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-copy-email]');
    if (!button) return;
    const status = button.parentElement?.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail ?? '');
    } catch {
      return; // No clipboard access: the mailto link next to the button still works.
    }
    button.textContent = button.dataset.copiedLabel ?? '';
    if (status) status.textContent = button.dataset.copiedLabel ?? '';
    window.setTimeout(() => {
      button.textContent = button.dataset.copyLabel ?? '';
      if (status) status.textContent = '';
    }, 1500);
  });
</script>
```

`src/layouts/Page.astro`:

```astro
---
import SiteFooter from '../components/SiteFooter.astro';
import SiteHeader from '../components/SiteHeader.astro';
import type { Locale } from '../i18n/config';
import type { RouteKey } from '../i18n/routes';
import Base from './Base.astro';

interface Props {
  title: string;
  description: string;
  locale: Locale;
  current: RouteKey;
  surface?: 'paper' | 'ink';
}

const { title, description, locale, current, surface = 'paper' } = Astro.props;
---

<Base title={title} description={description} locale={locale} surface={surface}>
  <SiteHeader slot="header" locale={locale} current={current} />
  <slot />
  <SiteFooter slot="footer" locale={locale} />
</Base>
```

- [ ] **Passo 4: Início**

`src/pages/[lang]/index.astro` (substituir o conteúdo):

```astro
---
import eu from '../../assets/photos/eu.jpg';
import HeroLight from '../../components/HeroLight.astro';
import { locales, type Locale } from '../../i18n/config';
import { copy } from '../../i18n/copy';
import { pathFor } from '../../i18n/routes';
import { t } from '../../i18n/ui';
import { getWork } from '../../i18n/work';
import Page from '../../layouts/Page.astro';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}

const locale = Astro.params.lang as Locale;
const text = copy[locale].home;
const [featured] = await getWork(locale);
---

<Page
  title={t(locale, 'home.title')}
  description={t(locale, 'home.description')}
  locale={locale}
  current="home"
  surface="ink"
>
  <section class="hero wrap" aria-labelledby="hero-title">
    <div class="hero__text">
      <p class="label hero__kicker">{text.kicker}</p>
      <h1 id="hero-title" class="hero__title">
        {text.title}
      </h1>
      <p class="hero__lead">{text.lead}</p>
    </div>
    <HeroLight
      src={eu}
      alt={text.photoAlt}
      sizes="(min-width: 64rem) 50vw, calc(100vw - 2rem)"
      locale={locale}
    />
  </section>

  <section class="featured" data-surface="paper" aria-labelledby="featured-title">
    <div class="wrap featured__grid">
      <p class="label featured__label">{text.featuredLabel}</p>
      <div class="featured__body">
        <h2 id="featured-title" class="featured__title">
          {text.featuredTitle}
        </h2>
        {featured && (
          <p class="label featured__meta">
            {featured.data.year} · {featured.data.disciplines.join(' · ')} · {featured.data.role}
          </p>
        )}
        <p class="featured__text">{text.featuredText}</p>
        <p class="featured__links">
          <a class="arrow-link" href={pathFor(locale, 'work')}>
            {text.featuredLink} <span aria-hidden="true">→</span>
          </a>
          <a class="arrow-link" href={pathFor(locale, 'about')}>
            {text.aboutLink} <span aria-hidden="true">→</span>
          </a>
        </p>
      </div>
    </div>
  </section>
</Page>

<style>
  .hero {
    display: grid;
    gap: var(--space-8);
    padding-block: var(--space-12) var(--space-16);
  }
  .hero__kicker {
    color: var(--fg-muted);
  }
  .hero__title {
    margin-top: var(--space-4);
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 1.4rem + 3vw, 4.5rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.02;
  }
  .hero__lead {
    max-width: 36ch;
    margin-top: var(--space-6);
    color: var(--fg-muted);
    font-size: var(--step-1);
    line-height: 1.35;
  }
  .hero :global(.hero-light) {
    aspect-ratio: 4 / 5;
  }
  @media (min-width: 64rem) {
    .hero {
      grid-template-columns: repeat(12, 1fr);
      align-items: end;
      min-height: calc(100svh - 3.5rem);
      padding-block: var(--space-12);
    }
    .hero__text {
      grid-column: 1 / span 6;
      padding-bottom: var(--space-4);
    }
    .hero :global(.hero-light) {
      grid-column: 7 / -1;
      aspect-ratio: auto;
      height: min(80svh, 52rem);
    }
  }

  .featured {
    padding-block: var(--space-16) var(--space-24);
  }
  .featured__grid {
    display: grid;
    gap: var(--space-6);
  }
  .featured__label {
    padding-top: var(--space-3);
    border-top: var(--rule-width) solid var(--fg);
  }
  .featured__title {
    font-family: var(--font-display);
    font-size: var(--step-4);
    font-weight: 700;
    letter-spacing: -0.025em;
    max-width: 18ch;
  }
  .featured__meta {
    margin-top: var(--space-6);
    color: var(--fg-muted);
  }
  .featured__text {
    max-width: 42ch;
    margin-top: var(--space-4);
    font-size: var(--step-1);
    line-height: 1.4;
  }
  .featured__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-8);
    margin-top: var(--space-8);
  }
  @media (min-width: 64rem) {
    .featured__grid {
      grid-template-columns: repeat(12, 1fr);
    }
    .featured__label {
      grid-column: 1 / span 3;
      align-self: start;
    }
    .featured__body {
      grid-column: 4 / -1;
      padding-top: var(--space-3);
      border-top: var(--rule-width) solid var(--rule);
    }
  }
</style>
```

- [ ] **Passo 5: Correr e confirmar que passam**

```bash
npm run check
npm run test:e2e -- pages hero-light i18n
```

Esperado: 0 erros; os testes de `pages.spec.ts` PASS (o teste do Início navega para `/pt/trabalho/`, que nesta tarefa ainda é o 404: o URL confere na mesma); `hero-light` e `i18n` continuam verdes.

- [ ] **Passo 6: Verificação visual**

`npm run dev` → `/pt/` a 1440 px e a 390 px. Desktop: texto à esquerda alinhado em baixo, foto com a luz nas colunas 7–12, destaque em papel por baixo, rodapé em tinta. Telemóvel: texto, depois foto 4:5, depois destaque. O email do rodapé numa só linha.

- [ ] **Passo 7: Commit**

```bash
git add src/components/SiteHeader.astro src/components/SiteFooter.astro src/layouts/Page.astro "src/pages/[lang]/index.astro" tests/e2e/pages.spec.ts
git commit -m "feat: Início com hero, destaque do DonGonçalo, cabeçalho e rodapé de contacto"
```

---

### Tarefa 5: Trabalho e Sobre

**Ficheiros:**
- Criar: `src/pages/[lang]/[page].astro`
- Modificar: `tests/e2e/pages.spec.ts` (acrescentar no fim)

**Interfaces:**
- Consome: `routes` (fase 1), `copy`, `t`, `getWork`, `workSlug`, `Page`.
- Produz: `/pt/trabalho/`, `/en/work/`, `/pt/sobre/`, `/en/about/`. Cada linha do índice tem `id` igual ao slug do projeto (a fase 4 transforma-a em link para o case study).

- [ ] **Passo 1: Acrescentar os testes que falham**

No fim de `tests/e2e/pages.spec.ts`:

```ts
for (const [locale, paths] of Object.entries(pages)) {
  test(`${locale}: the header marks the current section`, async ({ page }) => {
    for (const [key, path] of Object.entries(paths)) {
      await page.goto(path);
      const current = page.locator('.site-header [aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute('href', key === 'home' ? paths.home : path);
    }
  });
}

test('work lists the projects in order with their status', async ({ page }) => {
  await page.goto(pages.pt.work);
  await expect(page.locator('.work-row h2')).toHaveText(['Don Gonçalo', 'Este site']);
  await expect(page.locator('.work-row').first()).toContainText('Case study em preparação');
  await page.goto(pages.en.work);
  await expect(page.locator('.work-row h2')).toHaveText(['Don Gonçalo', 'This site']);
});

test('about shows the photo, the text, tools and languages', async ({ page }) => {
  await page.goto(pages.en.about);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About');
  await expect(page.locator('.about__figure img')).toHaveAttribute('alt', /Gonçalo Guerra/);
  await expect(page.getByText('running a CNC machine', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tools' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Languages' })).toBeVisible();
});

test('the language switch keeps the section', async ({ page }) => {
  await page.goto(pages.pt.about);
  await page.locator('.lang-switch a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/about\/$/);
  await page.goto(pages.en.work);
  await page.locator('.lang-switch a[hreflang="pt"]').click();
  await expect(page).toHaveURL(/\/pt\/trabalho\/$/);
});
```

- [ ] **Passo 2: Correr e confirmar que falham**

Correr: `npm run test:e2e -- pages`
Esperado: FAIL — as páginas de Trabalho e Sobre não existem.

- [ ] **Passo 3: Implementar**

`src/pages/[lang]/[page].astro`:

```astro
---
import { Picture } from 'astro:assets';
import eu2 from '../../assets/photos/eu2.jpg';
import { locales, type Locale } from '../../i18n/config';
import { copy } from '../../i18n/copy';
import { routes } from '../../i18n/routes';
import { t } from '../../i18n/ui';
import { getWork, workSlug } from '../../i18n/work';
import Page from '../../layouts/Page.astro';

// One file for the two section pages whose slug is translated (trabalho/work, sobre/about).
export function getStaticPaths() {
  return locales.flatMap((lang) =>
    (['work', 'about'] as const).map((key) => ({
      params: { lang, page: routes[key][lang] },
      props: { key },
    })),
  );
}

const locale = Astro.params.lang as Locale;
const { key } = Astro.props;
const about = copy[locale].about;
const work = key === 'work' ? await getWork(locale) : [];
---

{key === 'work' ? (
  <Page
    title={`${t(locale, 'work.title')} — Gonçalo Guerra`}
    description={t(locale, 'work.description')}
    locale={locale}
    current="work"
  >
    <section class="wrap page-head" aria-labelledby="page-title">
      <h1 id="page-title" class="page-title">
        {t(locale, 'work.title')}
      </h1>
    </section>
    <ol class="wrap work-index" role="list">
      {work.map((entry, index) => (
        <li class="work-row" id={workSlug(entry)}>
          <span class="label work-row__index" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 class="work-row__title">{entry.data.title}</h2>
          <p class="work-row__summary">{entry.data.summary}</p>
          <dl class="work-row__meta">
            <div>
              <dt class="label">{t(locale, 'work.year')}</dt>
              <dd>{entry.data.year}</dd>
            </div>
            <div>
              <dt class="label">{t(locale, 'work.disciplines')}</dt>
              <dd>{entry.data.disciplines.join(' · ')}</dd>
            </div>
            <div>
              <dt class="label">{t(locale, 'work.role')}</dt>
              <dd>{entry.data.role}</dd>
            </div>
          </dl>
          {entry.data.status === 'in-preparation' && (
            <p class="label work-row__status">{t(locale, 'work.status.inPreparation')}</p>
          )}
        </li>
      ))}
    </ol>
  </Page>
) : (
  <Page
    title={`${about.title} — Gonçalo Guerra`}
    description={t(locale, 'about.description')}
    locale={locale}
    current="about"
  >
    <div class="wrap about">
      <figure class="about__figure">
        <Picture
          src={eu2}
          alt={about.photoAlt}
          widths={[480, 720, 960]}
          sizes="(min-width: 64rem) 40vw, calc(100vw - 2rem)"
          formats={['avif', 'webp']}
          loading="eager"
          class="about__photo"
        />
      </figure>
      <div class="about__text">
        <h1 id="page-title" class="page-title">
          {about.title}
        </h1>
        {about.paragraphs.map((paragraph, index) => (
          <p class={index === 0 ? 'about__intro' : 'about__paragraph'}>{paragraph}</p>
        ))}
        <h2 class="label about__subtitle">{about.toolsTitle}</h2>
        <dl class="about__list">
          {about.tools.map((group) => (
            <div>
              <dt class="label">{group.group}</dt>
              <dd>{group.items.join(' · ')}</dd>
            </div>
          ))}
        </dl>
        <h2 class="label about__subtitle">{about.languagesTitle}</h2>
        <dl class="about__list">
          {about.languages.map((language) => (
            <div>
              <dt class="label">{language.name}</dt>
              <dd>{language.level}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </Page>
)}

<style>
  .page-head {
    padding-block: var(--space-16) var(--space-8);
  }
  .page-title {
    font-family: var(--font-display);
    font-size: clamp(3rem, 1rem + 9vw, 9rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 0.9;
  }

  .work-index {
    margin-bottom: var(--space-24);
    list-style: none;
  }
  .work-row {
    display: grid;
    gap: var(--space-3) var(--space-6);
    padding-block: var(--space-8);
    border-top: var(--rule-width) solid var(--fg);
  }
  .work-row:last-child {
    border-bottom: var(--rule-width) solid var(--rule);
  }
  .work-row__index,
  .work-row__status,
  .work-row__meta dt {
    color: var(--fg-muted);
  }
  .work-row__title {
    font-family: var(--font-display);
    font-size: var(--step-3);
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .work-row__summary {
    max-width: 48ch;
  }
  .work-row__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-8);
  }
  .work-row__meta dd {
    margin: 0;
  }
  @media (min-width: 64rem) {
    .work-row {
      grid-template-columns: repeat(12, 1fr);
      align-items: baseline;
    }
    .work-row__index {
      grid-column: 1;
    }
    .work-row__title {
      grid-column: 2 / span 4;
    }
    .work-row__summary {
      grid-column: 6 / span 4;
    }
    .work-row__meta {
      grid-column: 6 / span 7;
      grid-row: 2;
    }
    .work-row__status {
      grid-column: 10 / -1;
      grid-row: 1;
      text-align: right;
    }
  }

  .about {
    display: grid;
    gap: var(--space-8);
    padding-block: var(--space-12) var(--space-24);
  }
  /* The figure is the grid item; <picture> and <img> fill it. */
  .about__figure :global(picture) {
    display: block;
  }
  .about__figure :global(.about__photo) {
    width: 100%;
    /* height: auto overrides the height attribute Astro writes, so aspect-ratio applies. */
    height: auto;
    /* Square on small screens so the (dark) photo does not fill the first screen before the title. */
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center 35%;
    background: var(--ink);
  }
  .about__intro {
    margin-top: var(--space-8);
    font-size: var(--step-2);
    line-height: 1.25;
    letter-spacing: -0.01em;
    max-width: 30ch;
  }
  .about__paragraph {
    margin-top: var(--space-6);
    max-width: var(--measure);
  }
  .about__subtitle {
    margin-top: var(--space-16);
    padding-top: var(--space-3);
    border-top: var(--rule-width) solid var(--fg);
  }
  .about__list {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-6);
  }
  .about__list div {
    display: grid;
    gap: var(--space-1) var(--space-6);
  }
  .about__list dt {
    color: var(--fg-muted);
  }
  .about__list dd {
    margin: 0;
  }
  @media (min-width: 40rem) {
    .about__list div {
      grid-template-columns: 12rem 1fr;
      align-items: baseline;
    }
  }
  @media (min-width: 64rem) {
    .about {
      grid-template-columns: repeat(12, 1fr);
      align-items: start;
    }
    .about__figure {
      grid-column: 1 / span 5;
      position: sticky;
      top: var(--space-8);
    }
    .about__figure :global(.about__photo) {
      aspect-ratio: 4 / 5;
    }
    .about__text {
      grid-column: 7 / -1;
    }
    .about__intro {
      margin-top: var(--space-12);
    }
  }
</style>
```

- [ ] **Passo 4: Correr e confirmar que passam**

```bash
npm run check
npm run test:e2e -- pages
```

Esperado: 0 erros; todos os testes de `pages.spec.ts` PASS.

- [ ] **Passo 5: Verificação visual**

`/pt/trabalho/` e `/pt/sobre/` a 1440 px e a 390 px. Trabalho: título grande, linhas separadas por filetes, estado à direita no desktop. Sobre: no desktop a foto ocupa as colunas 1–5 em 4:5 e fica fixa ao fazer scroll; no telemóvel é quadrada e aparece antes do título sem ocupar o primeiro ecrã inteiro.

- [ ] **Passo 6: Commit**

```bash
git add "src/pages/[lang]/[page].astro" tests/e2e/pages.spec.ts
git commit -m "feat: páginas Trabalho e Sobre com slugs traduzidos"
```

---

### Tarefa 6: 404, acessibilidade, Lighthouse e revisão final

**Ficheiros:**
- Modificar: `src/pages/404.astro` (substituir), `tests/e2e/a11y.spec.ts`, `tests/e2e/pages.spec.ts` (acrescentar no fim), `lighthouserc.json`

- [ ] **Passo 1: Acrescentar os testes que falham**

No fim de `tests/e2e/pages.spec.ts`:

```ts
test.describe('at 360 px wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });
  for (const path of [...Object.values(pages.pt), ...Object.values(pages.en), '/nao-existe/']) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }
});
```

Em `tests/e2e/a11y.spec.ts`, acrescentar à lista `pages`, a seguir a `'/en/',`:

```ts
  '/pt/trabalho/',
  '/en/work/',
  '/pt/sobre/',
  '/en/about/',
```

E, no teste `lab pages are not indexed and are excluded from the sitemap`, a seguir a `expect(sitemap).toContain('/en/');`:

```ts
  for (const path of ['/pt/trabalho/', '/en/work/', '/pt/sobre/', '/en/about/']) {
    expect(sitemap).toContain(path);
  }
```

- [ ] **Passo 2: Correr e confirmar o estado**

Correr: `npm run test:e2e -- pages a11y`
Esperado: PASS. Estes testes são proteções de regressão sobre o que as Tarefas 4 e 5 já construíram (overflow a 360 px, axe e sitemap nas páginas novas), por isso não começam vermelhos. Se algum falhar, é um defeito real: corrigir antes de continuar.

- [ ] **Passo 3: 404**

`src/pages/404.astro` (substituir):

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="404 — Gonçalo Guerra" description="Página não encontrada · Page not found" noindex surface="ink">
  <section class="wrap not-found" aria-labelledby="not-found-title">
    <h1 id="not-found-title" class="not-found__code">
      404
    </h1>
    <p lang="pt">
      Esta página não existe.{' '}
      <a class="arrow-link" href="/pt/">
        Voltar ao início <span aria-hidden="true">→</span>
      </a>
    </p>
    <p lang="en">
      This page does not exist.{' '}
      <a class="arrow-link" href="/en/">
        Back to home <span aria-hidden="true">→</span>
      </a>
    </p>
  </section>
</Base>

<style>
  .not-found {
    display: grid;
    align-content: center;
    gap: var(--space-4);
    min-height: 100svh;
    padding-block: var(--space-16);
  }
  .not-found__code {
    font-family: var(--font-display);
    font-size: var(--step-hero);
    font-weight: 700;
    letter-spacing: -0.05em;
    line-height: 0.85;
    margin-bottom: var(--space-8);
  }
  .not-found p {
    font-size: var(--step-1);
  }
</style>
```

- [ ] **Passo 4: Lighthouse nas páginas novas**

Em `lighthouserc.json`, substituir a linha `"url": [...]` por:

```json
      "url": [
        "http://localhost/pt/",
        "http://localhost/pt/trabalho/",
        "http://localhost/pt/sobre/",
        "http://localhost/lab/luz/"
      ],
```

- [ ] **Passo 5: Verificação completa**

```bash
npm run check && npm run lint && npm run format:check
npm run test:unit
npm run build && npm run budget
npm run test:e2e
npx @lhci/cli@0.15.1 autorun
```

Esperado: tudo verde; 84 unitários; e2e todos PASS; orçamento cumprido (≈ 9,6 KB inicial, 16,4 KB WebGL); Lighthouse a cumprir as asserções nas quatro URLs.

Se o LCP do Início passar os 2,0 s (no CI ou localmente), **não subir o limite**. Medir primeiro com `npx @lhci/cli@0.15.1 collect --url=http://localhost/pt/` e ler o elemento e as fases do LCP no relatório. As causas candidatas, por ordem: o ficheiro da JetBrains Mono (40 KB) pedido no caminho crítico pelo rótulo do hero (testar com um subset ou `font-display: optional` nesse peso); a variante AVIF escolhida pelo `sizes` do hero; trabalho no fio principal antes do primeiro frame. Corrigir a causa medida e mostrar antes/depois ao Gonçalo.

- [ ] **Passo 6: Commit e push**

```bash
git add src/pages/404.astro tests/e2e lighthouserc.json
git commit -m "feat: 404 com o estilo do site, acessibilidade e Lighthouse nas páginas novas"
```

Parar e pedir o OK do Gonçalo para o push (ou ele faz o push pelo GitHub Desktop). Depois confirmar que o CI fica verde, incluindo o Lighthouse.

- [ ] **Passo 7: Revisão com o Gonçalo na Vercel (decisões humanas)**

Com o site publicado, o Gonçalo percorre Início → Trabalho → Sobre → Início no computador e no telemóvel e decide:

1. **Duração da tinta** (pendente do gate da fase 2): manter 250 + 250 ms ou subir (máximo 600 ms no total, conforme a especificação). Se subir, mudar `COVER_MS` e `UNCOVER_MS` em `src/components/InkTransition.astro` e confirmar que o teste `the whole transition completes within 1.5 s locally` continua verde.
2. **Textos em contexto:** se algum texto aprovado fica estranho na página real, ele decide a alteração; aplicar nos dois idiomas.

Registar as decisões em `docs/decisoes.md` e fazer commit.
