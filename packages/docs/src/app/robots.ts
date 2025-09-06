import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // todo: Use deployment URL?
  const baseUrl = 'https://nuqs.dev'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/stats', '/api']
    },
    sitemap: `${baseUrl}/sitemap.xml`
  }
}
