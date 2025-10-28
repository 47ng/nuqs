import { getBaseUrl } from '@/src/lib/url'
import { getGithubLastEdit } from 'fumadocs-core/content/github'
import type { MetadataRoute } from 'next'
import { cacheLife } from 'next/cache'
import { demos } from './playground/(demos)/demos'
import { blog, source } from './source'

export const dynamic = 'force-static'

type SitemapEntry = MetadataRoute.Sitemap[number]

const staticPages = [
  '', // home page
  '/blog',
  '/react-paris',
  '/stats',
  '/users',
  '/playground'
] as const

const staticPagesChangeFrequency: Record<
  (typeof staticPages)[number],
  SitemapEntry['changeFrequency']
> = {
  '': 'weekly',
  '/stats': 'hourly',
  '/users': 'weekly',
  '/blog': 'monthly',
  '/playground': 'monthly',
  // Archived
  '/react-paris': 'never'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache'
  cacheLife('static')
  const baseUrl = getBaseUrl()

  // todo: Automate retrieval of static pages
  // Static pages in app/(pages)

  // Get all docs pages from fumadocs
  const docsPages = source
    .getPages()
    .map<Promise<SitemapEntry>>(async page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: await getLastModified(`/content/docs/${page.path}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))

  // Get all blog posts from fumadocs
  const blogPages = blog.getPages().map<SitemapEntry>(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: page.data.date ? new Date(page.data.date) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6
  }))

  // Get all playground demo pages
  const playgroundPages = Object.keys(demos).map<Promise<SitemapEntry>>(
    async demoPath => ({
      url: `${baseUrl}/playground/${demoPath}`,
      lastModified: await getLastModified(
        `/src/app/playground/(demos)/${demoPath}/page.tsx`
      ),
      changeFrequency: 'monthly',
      priority: 0.4
    })
  )

  // Static pages
  const staticPageEntries = staticPages.map<SitemapEntry>(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: staticPagesChangeFrequency[path],
    priority: path === '' ? 1.0 : 0.5
  }))

  return Promise.all([
    ...staticPageEntries,
    ...docsPages,
    ...blogPages,
    ...playgroundPages
  ])
}

// --

async function getLastModified(path: string): Promise<Date> {
  'use cache'
  cacheLife('static')
  try {
    const lastEdit = await getGithubLastEdit({
      owner: '47ng',
      repo: 'nuqs',
      path: `packages/docs${path}`,
      sha: 'next',
      token: `Bearer ${process.env.GITHUB_TOKEN}`
    })
    return lastEdit ?? new Date()
  } catch (error) {
    console.error(`Error fetching last modification date for ${path}:`, error)
    return new Date()
  }
}
