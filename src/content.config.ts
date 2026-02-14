import { defineCollection, z } from 'astro:content';

const guides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    datePublished: z.string(),
    dateModified: z.string(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional().default([]),
  }),
});

const states = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    stateName: z.string(),
    stateAbbr: z.string(),
    datePublished: z.string(),
    dateModified: z.string(),
    exchange: z.string().optional().default('Healthcare.gov'),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional().default([]),
  }),
});

const tools = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    datePublished: z.string(),
    dateModified: z.string(),
    toolType: z.string(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional().default([]),
  }),
});

const faq = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    datePublished: z.string(),
    dateModified: z.string(),
  }),
});

export const collections = { guides, states, tools, faq };
