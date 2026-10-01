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
