import type { MetadataRoute } from 'next'
import { demos } from './playground/(demos)/demos'
import { blog, source } from './source'

export const revalidate = false // disable ISR

export default function sitemap(): MetadataRoute.Sitemap {
  // todo: Use deployment URL?
  const baseUrl = 'https://nuqs.dev'

  // todo: Automate retrieval of static pages
  // Static pages in app/(pages)
  const staticPages = [
    '', // home page
    '/blog',
    '/react-paris',
    '/stats',
    '/users',
    '/playground'
  ]

  // Get all docs pages from fumadocs
  const docsPages = source.getPages().map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }))

  // Get all blog posts from fumadocs
  const blogPages = blog.getPages().map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: page.data.date ? new Date(page.data.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }))

  // Get all playground demo pages
  const playgroundPages = Object.keys(demos).map(demoPath => ({
    url: `${baseUrl}/playground/${demoPath}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.4
  }))

  // Static pages
  const staticPageEntries = staticPages.map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '' ? 1.0 : 0.5
  }))

  return [...staticPageEntries, ...docsPages, ...blogPages, ...playgroundPages]
}
