import { describe, expect, it } from 'vitest';
import { t, ui } from '../../src/i18n/ui';

describe('ui dictionary', () => {
  it('has the same keys in every locale', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.pt).sort());
  });
  it('has no empty strings', () => {
    for (const dict of Object.values(ui)) {
      for (const value of Object.values(dict)) expect(value.trim()).not.toBe('');
    }
  });
  it('translates by locale', () => {
    expect(t('pt', 'nav.work')).toBe('Trabalho');
    expect(t('en', 'nav.work')).toBe('Work');
  });
});
