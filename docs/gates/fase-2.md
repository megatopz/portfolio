# Gate da fase 2 — 2026-10-02

Valores automáticos da última corrida local (`npm run budget` e `@lhci/cli@0.15.1 autorun`, mobile,
throttling simulado, 3 corridas por URL) sobre o commit `61a1d45`. As observações manuais são do
Gonçalo.

| Verificação | Resultado | Limite |
| --- | --- | --- |
| JS inicial (gzip) | 9,4 KB | ≤ 30 KB |
| JS WebGL (gzip) | 16,4 KB | ≤ 40 KB |
| Lighthouse /pt/ (perf / a11y / bp) | 100 / 100 / 100 | ≥ 95 |
| Lighthouse /lab/luz/ (perf / a11y / bp) | 100 / 100 / 100 | ≥ 95 |
| LCP /lab/luz/ | ~1,5–1,66 s (/pt/: ~1,5 s) | ≤ 2,0 s |
| CLS | 0 (/pt/ e /lab/luz/) | ≤ 0,05 |
| Fluidez luz, CPU 4× | Não medido em números (sem gravação no DevTools). No computador: fluida | sem quebras visíveis |
| Fluidez tinta, CPU 4× | Não medido em números (sem gravação no DevTools). No computador: fluida | sem quebras visíveis |
| Telemóvel real (iPhone 12, Safari) | Entrada da luz ok; inclinação suave; pista "Toca para mover a luz" e autorização ok; tinta fluida; sem aquecimento | — |
| Leitor de ecrã | Não testado manualmente: fica para a fase 5. Coberto pelos testes automáticos: axe, canvas `aria-hidden`, anúncio da mudança de página (route announcer) | canvas não anunciado |
| Tema de contraste do Windows | Não testado manualmente: fica para a fase 5. Coberto pelo teste e2e com `forced-colors` | conteúdo legível |
| CI (GitHub Actions) | Verde (observado pelo Gonçalo) | — |

Afinação para a fase 3: reavaliar a duração da tinta com páginas reais.

Decisão: ✅ avançar
