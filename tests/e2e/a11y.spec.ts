import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/pt/', '/en/', '/nao-existe/', '/lab/tipografia/', '/lab/luz/'];

for (const path of pages) {
  test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(path === '/nao-existe/' ? 404 : 200);
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

test('lab pages are not indexed and are excluded from the sitemap', async ({ page, request }) => {
  await page.goto('/lab/tipografia/');
  await expect(page.getByRole('heading', { level: 2, name: 'Bricolage Grotesque' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const res = await request.get('/sitemap-0.xml');
  expect(res.ok()).toBe(true);
  const sitemap = await res.text();
  expect(sitemap).not.toContain('/lab/');
  expect(sitemap).toContain('/pt/');
  expect(sitemap).toContain('/en/');
});
