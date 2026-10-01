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

test('keeps running after client-side navigation away and back', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.goto('/lab/tinta-a/');
  await page.getByRole('link', { name: 'Ir para luz' }).click();
  await expect(page).toHaveURL(/\/lab\/luz\/$/);
  await expect(hero(page)).toHaveAttribute('data-state', 'running', { timeout: 10_000 });
  await page.getByRole('link', { name: 'Ir para tinta A' }).click();
  await expect(page).toHaveURL(/\/lab\/tinta-a\/$/);
  await page.getByRole('link', { name: 'Ir para luz' }).click();
  await expect(page).toHaveURL(/\/lab\/luz\/$/);
  await expect(hero(page)).toHaveAttribute('data-state', 'running', { timeout: 10_000 });
  await expect(page.locator('[data-hero-light] canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a preference change while the effect is starting never creates a second scene', async ({ page }) => {
  // Count WebGL contexts requested on the hero canvas (the support probe uses a detached canvas).
  await page.addInitScript(() => {
    const w = window as unknown as { heroContexts: number };
    w.heroContexts = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error -- test override keeps the original signature
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl') && this.closest('[data-hero-light]')) w.heroContexts++;
      return original.call(this, type, ...rest);
    };
  });
  await page.goto('/lab/luz/', { waitUntil: 'domcontentloaded' });
  // Off then on again before the idle start has finished: both paths call start().
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(hero(page)).toHaveAttribute('data-state', 'running', { timeout: 10_000 });
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => (window as unknown as { heroContexts: number }).heroContexts)).toBe(1);
});
