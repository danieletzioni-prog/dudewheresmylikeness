import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const linkSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  note: z.string().optional(),
});

const states = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/states' }),
  schema: z.object({
    name: z.string(),
    abbr: z.string(),
    rightOfPublicity: z.string(),
    postMortem: z.string(),
    aiCoverage: z.string(),
    keyLegislation: z.array(linkSchema).default([]),
    notableCases: z.array(linkSchema).default([]),
    strength: z.enum(['none', 'weak', 'moderate', 'strong', 'explicit']).default('none'),
    summary: z.string().optional(),
    lastUpdated: z.string(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    sourceUrl: z.string().url(),
    sourceName: z.string(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
  }),
});

export const collections = { states, news };
