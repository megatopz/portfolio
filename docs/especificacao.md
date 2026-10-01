# Portfolio Gonçalo Guerra — Especificação

Sep 30, 2026 · @GG

Um portfolio novo, feito de raiz, que apresenta o Gonçalo como designer e developer web que constrói produtos digitais do esboço ao deploy. Funciona como biblioteca de trabalho que se envia por link a clientes e empresas.

## Objetivo e critérios de sucesso

O site tem de provar competência de três formas: pelo case study do DonGonçalo, pela qualidade do próprio site e por um About honesto e com personalidade.

Critérios de sucesso:

- Em 10 segundos, quem chega percebe o que o Gonçalo faz e vê o trabalho em destaque.
- Cada projeto tem URL próprio, partilhável isoladamente, em PT e EN.
- O site cumpre o orçamento de performance e WCAG 2.2 AA (secção Performance).
- Os efeitos visuais são reconhecidos como trabalho técnico próprio, não como template.
- Adicionar um novo projeto é criar um ficheiro de conteúdo, sem mexer em layout.
- Nenhum facto no site é inventado: experiência, métricas, clientes e resultados vêm só de fontes confirmadas.

Âmbito: site estático bilingue com Início, Trabalho, um case study, Colofão, Sobre e Contacto. Os trabalhos académicos antigos ficam fora, por decisão do Gonçalo.

## Posicionamento, público e mensagem

Posicionamento: designer e developer web orientado a produto. O design gráfico e a fotografia aparecem como sensibilidade visual, não como catálogo de serviços.

Público, por ordem de prioridade:

1. Empresas a recrutar (frontend, full-stack júnior, produto). Procuram prova de código, decisões e capacidade de explicar.
2. Clientes freelance, sobretudo pequenos negócios locais. Procuram um resultado real e confiança.
3. Estúdios e agências criativas. Procuram craft visual e motion.

Mensagem central: "Conheço o problema antes de desenhar a solução." A prova é o DonGonçalo: trabalhou lá como empregado de mesa, ajudante de cozinha e pizzaiolo, e depois construiu a plataforma do restaurante.

Rascunhos de título para o Início (a validar pelo Gonçalo):

- PT: "Desenho e construo produtos digitais, do primeiro esboço ao deploy."
- EN: "I design and build digital products, from first sketch to deploy."

Tom: direto, primeira pessoa, frases curtas, sem jargão de marketing ("soluções criativas e eficazes" fica de fora). Nenhuma barra ou ponto de autoavaliação de competências.

## Inventário de conteúdo

O conteúdo essencial existe; faltam sobretudo capturas do DonGonçalo, textos finais e algumas confirmações técnicas.

| Conteúdo | Estado | Fonte ou ação |
| --- | --- | --- |
| Identidade: 26 anos (17/11/1999), Sever do Vouga, Aveiro | Disponível | Gonçalo |
| Licenciatura TDM, ESTG Viseu, concluída | Disponível | Gonçalo |
| Contactos: email, telefone | Disponível | CV e site antigo |
| LinkedIn, Instagram, Facebook | Disponível | Site antigo; decidir quais mostrar |
| GitHub `megatopz`, 0 repos públicos | Parcial | Rever nome e tornar o portfolio público |
| Percurso: restauração (DonGonçalo), CNC em carpintaria | Disponível | Gonçalo; datas em falta |
| Fotos `eu.jpeg` e `eu2.jpeg`, 1600×1600, P&B | Disponível | Recortar acima do logótipo da t-shirt |
| Case study DonGonçalo: factos, stack, decisões, desafios | Disponível | Dois resumos consolidados |
| Capturas DonGonçalo (web e backoffice, desktop e mobile) | Em falta | Correr em local com dados de teste |
| Vídeos curtos do fluxo de reserva | Em falta | Gravar em local |
| Confirmações no código (SameSite, rate limits, packages, referência) | Em falta | Gonçalo verifica no repo |
| Licenças de fontes e imagens do DonGonçalo | Em falta | Confirmar com o cliente |
| Aprendizagens pessoais do projeto | Em falta | Gonçalo escreve |
| Texto do About e títulos finais | Em falta | Rascunho a partir dos factos, validado pelo Gonçalo |
| CV atualizado em PDF | Em falta | Refazer com dados atuais |
| Domínio do portfolio | Em falta | Decidir e registar |

## Arquitetura de informação e rotas

Quatro destinos principais, dois projetos com URL próprio e o contacto presente em todas as páginas.

&#91;embedded content: mapa do site · 6 destinos, PT e EN\]

A versão EN espelha a PT (`/en/work/don-goncalo`, `/en/about`) e a troca de idioma mantém a página em que se está. O DonGonçalo é o único destino com cor.

## Páginas

Seis páginas e uma 404. Cada uma tem um único trabalho a fazer.

**Início.** Hero com a foto `eu.jpeg` e o shader de luz. Nome, título e uma linha de proposta visíveis desde o primeiro frame. Abaixo, o DonGonçalo em destaque com entrada direta no case study, uma linha curta sobre o percurso e o contacto. Sem listas de serviços.

**Trabalho.** Índice tipográfico, uma linha por projeto: nome, ano, disciplinas, papel. No hover (desktop) ou em foco, aparece uma pré-visualização. Hoje tem duas entradas: DonGonçalo e "Este site". Preparado para filtros por disciplina quando houver mais de quatro projetos.

**Case study DonGonçalo.** É aqui que a cor aparece pela primeira vez. Estrutura:

1. Ficha técnica: cliente, ano, papel, duração (cerca de 10 semanas, jul.–set. 2026), stack, estado, link.
2. Contexto: de pizzaiolo a quem construiu a plataforma.
3. Problema: carta, pratos do dia e reservas dependentes de contacto direto.
4. Âmbito do MVP: carta digital, pratos do dia, reservas, backoffice, PT/EN, PWA.
5. Arquitetura: diagrama de web, admin, API e base de dados, com os serviços de alojamento.
6. Modelo de dados moldado pela cozinha: dois tamanhos, a "Mário" só em pequeno, extras no fim, subcategorias de bebidas.
7. Fluxo de reservas: diagrama de estados, validação manual e camadas anti-spam.
8. Direção visual e iterações: referência Qitchen, cor bordô do logótipo, carta sem fotos, legibilidade.
9. Três desafios técnicos: service worker, migração de domínio com CSP, datas perto da meia-noite.
10. Estado atual: entregue, 73 itens em 7 categorias, reservas desligadas a pedido do cliente, próximos passos.

**Este site (Colofão).** Segundo caso técnico. Explica o shader de luz, as transições, o design system, as decisões de performance e acessibilidade, com os números do Lighthouse e ligação ao repositório público.

**Sobre.** Foto `eu2.jpeg`, texto curto na primeira pessoa, percurso (restauração, CNC, licenciatura), ferramentas agrupadas sem pontuações, línguas, CV em PDF.

**Contacto.** Email com botão de copiar e feedback, telefone, LinkedIn, GitHub. Sem formulário. Pode viver no rodapé de todas as páginas em vez de página própria.

**404.** Uma frase e o regresso ao Início, com o mesmo efeito de luz em versão mínima.

## Direção visual "Luz e tinta" e design system

O site é monocromático; a cor pertence só ao trabalho. A luz revela, a tinta separa, a grelha organiza.

Princípios:

- **Luz.** No hero, o cursor é a fonte de luz que revela a foto a contraluz.
- **Tinta.** Transições entre páginas por dissolução orgânica, gerada por ruído.
- **Papel e tinta.** As páginas alternam entre secções claras e escuras; o espetáculo fica no hero e nas transições, a leitura fica calma.
- **Cor = trabalho.** Cada projeto traz o seu acento. No DonGonçalo: fotografia quente do forno e bordô `#6B1F3A`.
- **Grão** comum às fotos, ao shader e aos fundos.
- **Folha técnica.** Grelha com filetes de 1px visíveis, rótulos monoespaçados em caixa alta, anotações nos diagramas.

Referência: vídeo enviado pelo Gonçalo (hero P&B com revelação por fumo). Aproveita-se o princípio, não o efeito em vídeo.

### Cor

| Token | Valor | Uso |
| --- | --- | --- |
| `--ink` | `#0A0A0A` | Fundo escuro, texto sobre papel |
| `--paper` | `#EFEDE8` | Fundo claro, texto sobre tinta |
| `--graphite` | `#6B6B6B` | Texto secundário sobre papel |
| `--ash` | `#A3A3A3` | Texto secundário sobre tinta |
| `--rule` | 12% de opacidade do texto | Filetes e divisões |
| `--project-accent` | Definido por projeto | Só dentro de páginas de projeto; nunca como cor de texto corrido |

Todos os pares de texto são validados a 4,5:1 ou mais antes da implementação.

### Tipografia

Três papéis, fontes com licença OFL, alojadas no próprio site em woff2 com subset latino. Escolha final após testar especímenes com os títulos reais.

- **Display:** grotesca pesada com eixo de largura. Candidatas: Archivo (variável em peso e largura) e Bricolage Grotesque.
- **Texto:** a mesma família do display em peso regular, ou Geist.
- **Mono:** JetBrains Mono ou Geist Mono, para rótulos, fichas técnicas e anotações.

Escala fluida com `clamp()`, rácio 1,25 no mobile e 1,333 no desktop. Títulos do hero até cerca de 14vw. Texto corrido entre 17 e 19px, medida máxima de 68 caracteres.

### Grelha e espaçamento

Grelha de 12 colunas no desktop, 6 no tablet, 4 no mobile, com filetes visíveis nos pontos de estrutura. Espaçamento em base de 4px. Cantos retos (raio 0). Sem sombras nem cartões.

### Componentes base

Rótulo mono, filete, linha de projeto (índice), ficha técnica, figura com legenda, diagrama anotado, botão de copiar, navegação, troca de idioma, rodapé de contacto. Nada é criado antes de ser necessário numa página real.

## Motion e interação

Cada animação tem de servir narrativa, hierarquia ou feedback; o conteúdo nunca espera por ela.

| Momento | Comportamento | Duração | Com `prefers-reduced-motion` |
| --- | --- | --- | --- |
| Hero: luz | Shader WebGL; o cursor é uma fonte de luz com inércia que revela a foto e o grão | Contínuo | Foto estática com luz fixa |
| Hero: mobile | A luz deriva devagar sozinha; sem giroscópio | Contínuo, lento | Foto estática |
| Transição de página | Dissolução de tinta por ruído, orientada no sentido da navegação | 450–600 ms | Crossfade de 150 ms |
| Entrada de secções | Texto sobe 8–12px e aparece, uma vez por sessão | 300–400 ms | Aparece sem movimento |
| Índice de trabalho | Pré-visualização segue o cursor com atraso; em teclado aparece fixa junto à linha em foco | 200 ms | Aparece sem movimento |
| Entrar no case study | A cor do projeto invade a página a partir da imagem | 500 ms | Troca direta |
| Copiar email | Rótulo muda para "Copiado" e volta | 1,5 s | Igual, sem animação |
| Hover de links | Filete desenha-se da esquerda para a direita | 200 ms | Sublinhado estático |

Tokens de tempo: `--t-fast` 150 ms, `--t-base` 250 ms, `--t-slow` 500 ms. Curvas: `--ease-out` cubic-bezier(0.22, 1, 0.36, 1) para entradas e `--ease-in-out` para transições.

Regras:

- Só se animam `transform`, `opacity` e uniforms de shader; nunca propriedades de layout.
- O cursor nativo mantém-se sempre; nada de cursores personalizados que o escondam.
- Sem ecrã de carregamento nem intro que bloqueie o acesso.
- Se o WebGL falhar ou não estiver disponível, o site continua completo com imagens estáticas.
- O canvas pausa quando sai do ecrã ou o separador fica em segundo plano.

## Stack e arquitetura técnica

Proposta: Astro, TypeScript, CSS nativo com tokens e OGL para WebGL, publicado como site estático.

| Camada | Escolha | Porquê |
| --- | --- | --- |
| Framework | Astro (versão estável atual) | Gera HTML estático com zero JS por omissão; routing i18n nativo; ilhas só onde há interação |
| Conteúdo | Content collections em MDX, com schema tipado | Cada projeto é um ficheiro; a biblioteca cresce sem mexer em layout |
| Linguagem | TypeScript em modo estrito | Consistência com o DonGonçalo e segurança nos schemas |
| Estilos | CSS nativo: custom properties, `@layer`, container queries | O design system vive nos tokens; sem dependência de framework CSS |
| WebGL | OGL, carregado só depois do conteúdo | Muito mais leve que um motor 3D completo; shaders escritos à mão |
| Transições | View Transitions do Astro com overlay de tinta em canvas | Fallback nativo em crossfade quando o overlay não está disponível |
| Imagens | `astro:assets` com AVIF e WebP, tamanhos responsivos | Controlo do LCP e do peso |
| Fontes | Self-hosted woff2 com subset e preload da fonte do hero | Sem pedidos externos nem saltos de layout |
| Qualidade | ESLint, Prettier, Playwright com axe-core, Lighthouse CI em GitHub Actions | Acessibilidade e performance verificadas a cada commit |
| Alojamento | Vercel ou Cloudflare Pages, estático | Ambos já conhecidos pelo Gonçalo |

Estrutura prevista do repositório:

```
portfolio/
├── src/
│   ├── content/work/      projetos em MDX (pt e en)
│   ├── components/        componentes do design system
│   ├── gl/                shaders e cena OGL (luz, tinta)
│   ├── layouts/
│   ├── pages/[lang]/      rotas por idioma
│   ├── i18n/              textos de interface
│   └── styles/            tokens, reset, camadas
├── public/                cv-pt.pdf, cv-en.pdf, favicon
└── tests/                 Playwright + axe
```

Sem backend, sem formulário, sem CMS. Analytics: nenhum no lançamento; se for preciso, uma solução sem cookies.

Risco principal: a transição de tinta integrada com View Transitions é a peça mais complexa. Faz-se um protótipo isolado na fase 2 antes de a integrar.

## Performance, acessibilidade e SEO

Os efeitos só entram se o site cumprir estes limites num telemóvel médio em 4G.

### Orçamento de performance

| Métrica | Limite |
| --- | --- |
| LCP | ≤ 2,0 s |
| CLS | ≤ 0,05 |
| INP | ≤ 150 ms |
| JS inicial (gzip), sem WebGL | ≤ 30 KB |
| Módulo WebGL (OGL + shaders, gzip), carregado depois | ≤ 40 KB |
| Imagem do hero (AVIF) | ≤ 120 KB |
| Lighthouse, todas as categorias | ≥ 95 |

### Acessibilidade (WCAG 2.2 AA)

- Todo o conteúdo existe em HTML; o canvas é decorativo (`aria-hidden`) e nunca contém texto.
- Contraste mínimo de 4,5:1 no texto e 3:1 em elementos gráficos, validado em papel e em tinta.
- Navegação completa por teclado, foco sempre visível, link para saltar para o conteúdo.
- `prefers-reduced-motion` respeitado em todos os momentos da tabela de motion.
- `lang` correto por página; alt text escrito à mão; diagramas com descrição em texto.
- Modo de alto contraste (`forced-colors`) sem grão nem efeitos.
- Verificação automática com axe em cada página e revisão manual com leitor de ecrã (VoiceOver e NVDA).

### SEO e partilha

- `hreflang` entre PT e EN, sitemap, URLs canónicos.
- Título, descrição e imagem Open Graph próprios para cada projeto: o link enviado a um cliente mostra o projeto certo.
- Dados estruturados `Person` e `CreativeWork`.
- `/` encaminha para `/pt` por omissão, com troca de idioma que mantém a mesma página.

## Fases de implementação

Cinco fases em sequência; os efeitos são validados antes de qualquer página depender deles.

&#91;embedded content: fases de implementação · 5 fases, 2 gates\]

Cada fase termina com revisão visual e técnica. O plano de implementação detalhado, tarefa a tarefa, é escrito depois de esta especificação ser aprovada.

## Decisões em aberto e fora de âmbito

As decisões marcadas como bloqueantes têm de estar fechadas antes da fase indicada.

- [ ] Domínio do portfolio (ex.: nome próprio em `.com` ou `.pt`) — antes da fase 5
- [ ] Nome de utilizador do GitHub e repositório público do portfolio — antes da fase 1
- [ ] Títulos, mensagem central e texto do About (os desta especificação são rascunhos) — antes da fase 3
- [ ] Redes a mostrar: LinkedIn e GitHub sim; Instagram e Facebook a decidir — antes da fase 3
- [ ] Como referir o desenvolvimento com apoio de IA no case study e no colofão — antes da fase 4
- [ ] Confirmar no código: SameSite dos cookies, limites de rate limiting, uso de `packages/`, formato da referência — antes da fase 4
- [ ] Licenças de fontes e imagens do DonGonçalo, com o cliente — bloqueante para publicar o case study
- [ ] Passagem de acessibilidade no DonGonçalo (contraste dos preços, alt text, teclado) — recomendada antes de publicar
- [ ] Capturas e vídeos do DonGonçalo com dados de teste — antes da fase 4
- [ ] Aprendizagens pessoais do projeto, escritas pelo Gonçalo — antes da fase 4
- [ ] Datas do trabalho na restauração e na carpintaria, se forem para o About — antes da fase 3
- [ ] CV atualizado em PT e EN — antes da fase 5

Fora de âmbito nesta versão: blog, CMS, formulário de contacto, alternância claro/escuro (o site já alterna por secção), trabalhos académicos antigos, analytics com cookies.
