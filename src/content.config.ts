import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/timeline' }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    location: z.string().optional(),
    tags: z.array(z.string()).default([]),
    highlight: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    link: z.url().optional(),
    repo: z.url().optional(),
    tech: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const certs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/certs' }),
  schema: z.object({
    title: z.string(),
    issuer: z.string(),
    issued: z.string(),
    credentialUrl: z.url().optional(),
    skills: z.array(z.string()).default([]),
  }),
});

export const collections = {
  timeline,
  projects,
  certs,
};
