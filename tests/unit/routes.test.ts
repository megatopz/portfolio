import { describe, expect, it } from 'vitest';
import { alternatePath, parsePath, pathFor } from '../../src/i18n/routes';

describe('pathFor', () => {
  it('builds localized paths with trailing slash', () => {
    expect(pathFor('pt', 'home')).toBe('/pt/');
    expect(pathFor('en', 'work')).toBe('/en/work/');
    expect(pathFor('pt', 'work', 'don-goncalo')).toBe('/pt/trabalho/don-goncalo/');
  });
});

describe('parsePath', () => {
  it('parses home, sections and slugs', () => {
    expect(parsePath('/pt/')).toEqual({ locale: 'pt', key: 'home' });
    expect(parsePath('/en/about')).toEqual({ locale: 'en', key: 'about' });
    expect(parsePath('/pt/trabalho/don-goncalo/')).toEqual({
      locale: 'pt',
      key: 'work',
      slug: 'don-goncalo',
    });
  });
  it('rejects unknown locales, sections and deep paths', () => {
    expect(parsePath('/fr/')).toBeNull();
    expect(parsePath('/pt/work/')).toBeNull();
    expect(parsePath('/pt/trabalho/a/b/')).toBeNull();
    expect(parsePath('/')).toBeNull();
  });
});

describe('alternatePath', () => {
  it('keeps the same page when switching language', () => {
    expect(alternatePath('/pt/sobre/', 'en')).toBe('/en/about/');
    expect(alternatePath('/en/work/don-goncalo/', 'pt')).toBe('/pt/trabalho/don-goncalo/');
  });
  it('falls back to the target home for unknown paths', () => {
    expect(alternatePath('/lab/luz/', 'en')).toBe('/en/');
  });
});
