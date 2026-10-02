import { expect, test, type Page } from '@playwright/test';

const ink = '[data-ink]';
/** Local timeouts are the tight ones; only the CI runner (SwiftShader, shared CPU) gets 5 s to settle. */
const onCi = (local: number) => (process.env.CI ? 5_000 : local);
const IDLE_TIMEOUT = onCi(2_000);
/** Local performance promise; the CI runner gets headroom because software WebGL is much slower. */
const TRANSITION_LIMIT = process.env.CI ? 3_000 : 1_500;

type InkWindow = { inkLog?: string[] };

/** Records every data-state value the persisted canvas takes, in order. */
async function watchInk(page: Page) {
  await page.evaluate(() => {
    const canvas = document.querySelector('[data-ink]');
    const w = window as unknown as InkWindow;
    w.inkLog = [];
    if (!canvas) return;
    new MutationObserver(() => w.inkLog?.push(canvas.getAttribute('data-state') ?? '')).observe(canvas, {
      attributes: true,
      attributeFilter: ['data-state'],
    });
  });
}

/** The first navigation creates the overlay lazily, which logs one initial 'idle'; drop it. */
const inkLog = async (page: Page) => {
  const log = await page.evaluate(() => (window as unknown as InkWindow).inkLog ?? []);
  return log[0] === 'idle' ? log.slice(1) : log;
};
const FULL_CYCLE = ['covering', 'covered', 'uncovering', 'idle'];

test('navigates between pages and the ink ends uncovered', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await watchInk(page);
  await page.getByRole('link', { name: 'Ir para tinta B' }).click();
  await expect(page).toHaveURL(/\/lab\/tinta-b\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta B');
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  expect(await inkLog(page)).toEqual(FULL_CYCLE);
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
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  await watchInk(page);
  await page.goBack();
  await expect(page).toHaveURL(/tinta-a/);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  expect(await inkLog(page)).toEqual(FULL_CYCLE);
});

test('rapid successive navigations do not leave the ink stuck', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await watchInk(page);
  await page.getByRole('link', { name: 'Ir para tinta B' }).click({ noWaitAfter: true });
  await page.getByRole('link', { name: 'Ir para luz' }).click({ noWaitAfter: true });
  await expect(page).toHaveURL(/\/lab\/(luz|tinta-b)\/$/);
  await page.waitForLoadState();
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: onCi(3_000) });
  await page.waitForTimeout(700);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle');
  const log = await inkLog(page);
  expect(log).toContain('covering');
  expect(log.at(-1)).toBe('idle');
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
  // Warm-up round trip: the first navigation also pays for the lazy ogl import and shader
  // compilation (SwiftShader, 6 parallel workers), which made the cold timing flaky (1.5-1.6 s).
  await page.getByRole('link', { name: 'Ir para tinta B' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta B');
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  await page.getByRole('link', { name: 'Ir para tinta A' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta A');
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  // Timed inside the page, from Astro starting the navigation to the overlay back at rest, so
  // Playwright's own round trips do not count.
  await page.evaluate(() => {
    const w = window as unknown as { inkTiming?: { start?: number; end?: number } };
    const timing: { start?: number; end?: number } = {};
    w.inkTiming = timing;
    document.addEventListener('astro:before-preparation', () => (timing.start ??= performance.now()), {
      once: true,
    });
    const canvas = document.querySelector('[data-ink]');
    if (!canvas) return;
    new MutationObserver(() => {
      if (timing.start !== undefined && canvas.getAttribute('data-state') === 'idle')
        timing.end ??= performance.now();
    }).observe(canvas, { attributes: true, attributeFilter: ['data-state'] });
  });
  await page.getByRole('link', { name: 'Ir para tinta B' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tinta B');
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  const elapsed = await page.evaluate(() => {
    const { start, end } = (window as unknown as { inkTiming: { start?: number; end?: number } }).inkTiming;
    return start !== undefined && end !== undefined ? end - start : Number.POSITIVE_INFINITY;
  });
  expect(elapsed).toBeLessThan(TRANSITION_LIMIT);
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

test('a link to a non-HTML file leaves the page uncovered', async ({ page }) => {
  // Astro fetches the target, sees it is not HTML and falls back to location.href, which
  // downloads the file and keeps the current page on screen.
  await page.route('**/lab/ficheiro.bin', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      headers: { 'content-disposition': 'attachment; filename="ficheiro.bin"' },
      body: 'x',
    }),
  );
  await page.goto('/lab/tinta-a/');
  await page.evaluate(() => {
    const link = Object.assign(document.createElement('a'), {
      href: '/lab/ficheiro.bin',
      textContent: 'Ficheiro',
    });
    document.querySelector('.lab')?.append(link);
  });
  await watchInk(page);
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Ficheiro' }).click();
  await download;
  await expect(page).toHaveURL(/\/lab\/tinta-a\/$/);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: IDLE_TIMEOUT });
  await page.waitForTimeout(500);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle');
});

test('a page restored from the back/forward cache is never left covered', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  // Hold the next page so the ink stays covered, as when the page was frozen mid-navigation.
  await page.route('**/lab/tinta-b/', () => {});
  await page.getByRole('link', { name: 'Ir para tinta B' }).click({ noWaitAfter: true });
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'covered', { timeout: 5_000 });
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'idle', { timeout: onCi(1_000) });
});

test('a fresh page load does not uncover a navigation in progress', async ({ page }) => {
  await page.goto('/lab/tinta-a/');
  await page.route('**/lab/tinta-b/', () => {});
  await page.getByRole('link', { name: 'Ir para tinta B' }).click({ noWaitAfter: true });
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'covered', { timeout: 5_000 });
  await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')));
  await page.waitForTimeout(300);
  await expect(page.locator(ink)).toHaveAttribute('data-state', 'covered');
});
