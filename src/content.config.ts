import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * One file per project and language: src/content/work/<locale>/<slug>.md. The slug is the same in
 * both languages, so /pt/trabalho/<slug>/ and /en/work/<slug>/ point at the same project (phase 4).
 */
const work = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    year: z.number().int().min(2000).max(2100),
    role: z.string(),
    disciplines: z.array(z.string()).min(1),
    summary: z.string(),
    order: z.number().int(),
    status: z.enum(['in-preparation', 'published']),
  }),
});

export const collections = { work };
