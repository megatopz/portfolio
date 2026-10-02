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
