/**
 * lib/markdown.ts
 * Utility functions for reading markdown content from content/ directory.
 * Uses gray-matter for frontmatter parsing and remark for HTML conversion.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export interface GuideFrontmatter {
  title: string
  description: string
  datePublished: string
  dateModified: string
  keyTakeaways?: string[]
  faqs?: { question: string; answer: string }[]
}

export interface StateFrontmatter {
  title: string
  description: string
  stateName: string
  stateAbbr: string
  exchange: string
  datePublished: string
  dateModified: string
  faqs?: { question: string; answer: string }[]
}

export interface FAQFrontmatter {
  title: string
  description: string
  dateModified: string
  faqs?: { question: string; answer: string }[]
}

export interface ToolFrontmatter {
  title: string
  description: string
  datePublished: string
  dateModified: string
  faqs?: { question: string; answer: string }[]
}

export interface ContentFile<T> {
  slug: string
  frontmatter: T
  contentHtml: string
}

async function mdToHtml(content: string): Promise<string> {
  const result = await remark().use(remarkHtml).process(content)
  return result.toString()
}

/** Read all markdown files from a collection directory, returning slugs + frontmatter. */
export function getCollectionSlugs(collection: string): string[] {
  const dir = path.join(CONTENT_DIR, collection)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
}

/** Read a single markdown file from a collection by slug. */
export async function getCollectionEntry<T>(
  collection: string,
  slug: string
): Promise<ContentFile<T> | null> {
  const filepath = path.join(CONTENT_DIR, collection, `${slug}.md`)
  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  const contentHtml = await mdToHtml(content)

  return {
    slug,
    frontmatter: data as T,
    contentHtml,
  }
}

/** Read all entries from a collection with frontmatter only (no HTML rendering). */
export function getCollectionList<T>(collection: string): { slug: string; frontmatter: T }[] {
  const dir = path.join(CONTENT_DIR, collection)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
      const { data } = matter(raw)
      return { slug, frontmatter: data as T }
    })
}
