import { describe, expect, it } from 'vitest';
import { copy } from '../../src/i18n/copy';

/** Replaces every string with a marker, so two locales can be compared by shape only. */
function shape(value: unknown): unknown {
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return value.map(shape);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]));
  }
  return value;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('page copy', () => {
  it('has the same structure in PT and EN (keys, paragraphs, tool groups, items, languages)', () => {
    expect(shape(copy.en)).toEqual(shape(copy.pt));
  });

  it('has no empty strings', () => {
    for (const value of [...strings(copy.pt), ...strings(copy.en)]) expect(value.trim()).not.toBe('');
  });

  it('uses the same tool names in both languages, apart from the design group', () => {
    const technical = (locale: 'pt' | 'en') =>
      copy[locale].about.tools.slice(0, 4).map((group) => group.items);
    expect(technical('en')).toEqual(technical('pt'));
  });
});
