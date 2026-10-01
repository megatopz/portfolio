export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'pt' || value === 'en';
}
