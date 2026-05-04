import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const states = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/states' }),
  schema: z.object({
    name: z.string(),
    abbr: z.string(),
    /**
     * Categorization scheme (May 2026):
     *  1 — Comprehensive AI-era statute (CA, TN, NY)
     *  2 — Strong publicity statute, AI coverage developing
     *  3 — Traditional publicity statute, no AI-specific overlay
     *  4 — Common law or unverified
     */
    category: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(4),
    /** One-line hover/sub-headline used in the map tooltip and side panel. */
    tooltip: z.string().optional(),
    /** Four-line practitioner summary (rendered in this order on state pages). */
    rightOfPublicity: z.string(),
    postMortem: z.string(),
    aiCoverage: z.string(),
    remedy: z.string().optional(),
    /** Editorial commentary paragraph. */
    whatsInteresting: z.string().optional(),
    /** Array of citation strings. May contain markdown-style [text](url) links. */
    primarySources: z.array(z.string()).default([]),
    lastVerified: z.string().optional(),
  }),
});

export const collections = { states };
