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
