import { isLocale, type Locale } from './config';

export const routes = {
  home: { pt: '', en: '' },
  work: { pt: 'trabalho', en: 'work' },
  about: { pt: 'sobre', en: 'about' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

export interface ParsedPath {
  locale: Locale;
  key: RouteKey;
  slug?: string;
}

export function pathFor(locale: Locale, key: RouteKey, slug?: string): string {
  const parts = [locale, routes[key][locale], slug].filter((part): part is string => Boolean(part));
  return `/${parts.join('/')}/`;
}

export function parsePath(pathname: string): ParsedPath | null {
  const [first, second, third, ...rest] = pathname.split('/').filter(Boolean);
  if (!isLocale(first) || rest.length > 0) return null;
  if (second === undefined) return { locale: first, key: 'home' };
  const key = (Object.keys(routes) as RouteKey[]).find(
    (candidate) => candidate !== 'home' && routes[candidate][first] === second,
  );
  if (key === undefined) return null;
  return third === undefined ? { locale: first, key } : { locale: first, key, slug: third };
}

export function alternatePath(pathname: string, target: Locale): string {
  const parsed = parsePath(pathname);
  if (parsed === null) return pathFor(target, 'home');
  return pathFor(target, parsed.key, parsed.slug);
}
