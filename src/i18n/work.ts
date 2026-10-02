import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './config';

export type WorkEntry = CollectionEntry<'work'>;

/** The slug is the file name; the folder is the locale (src/content/work/<locale>/<slug>.md). */
export function workSlug(entry: WorkEntry): string {
  return entry.id.split('/').pop() ?? entry.id;
}

/** Projects in one language, in the order set by their `order` field. */
export async function getWork(locale: Locale): Promise<WorkEntry[]> {
  const entries = await getCollection('work', (entry) => entry.id.startsWith(`${locale}/`));
  return entries.sort((a, b) => a.data.order - b.data.order);
}
