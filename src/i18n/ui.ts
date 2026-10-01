import type { Locale } from './config';

export const ui = {
  pt: {
    'skip.toMain': 'Saltar para o conteúdo',
    'lang.label': 'Idioma',
    'lang.pt': 'Português',
    'lang.en': 'English',
    'nav.home': 'Início',
    'nav.work': 'Trabalho',
    'nav.about': 'Sobre',
    'home.title': 'Gonçalo Guerra — Designer e developer web',
    'home.description': 'Portfolio de Gonçalo Guerra, designer e developer web.',
  },
  en: {
    'skip.toMain': 'Skip to content',
    'lang.label': 'Language',
    'lang.pt': 'Português',
    'lang.en': 'English',
    'nav.home': 'Home',
    'nav.work': 'Work',
    'nav.about': 'About',
    'home.title': 'Gonçalo Guerra — Web designer and developer',
    'home.description': 'Portfolio of Gonçalo Guerra, web designer and developer.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['pt'];

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key];
}
