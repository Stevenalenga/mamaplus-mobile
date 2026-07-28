import { API_BASE_URL } from '../constants'
import type { BlogPost } from '../types'

/** Resolve relative blog image paths (e.g. /api/files/...) against the API host. */
export function resolveBlogImageUrl(image?: string | null): string | null {
  if (!image?.trim()) return null
  const trimmed = image.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${trimmed}`
  }
  return trimmed
}

export function formatBlogDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getBlogCategories(posts: BlogPost[]): string[] {
  return [...new Set(posts.map((post) => post.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
}
