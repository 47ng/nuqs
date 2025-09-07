import { getBaseUrl } from '@/src/lib/url'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()
  if (process.env.VERCEL_ENV === 'production') {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/api']
        }
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl
    }
  }
  // No crawling on preview environments
  return {
    rules: {
      userAgent: '*',
      disallow: ['/']
    }
  }
}
