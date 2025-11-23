import { getLastModified } from '@/src/lib/get-last-modified'
import { readRegistry } from '@/src/registry/read'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

export async function GET() {
  const rssXml = await generateRssXml()
  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml'
    }
  })
}

async function generateRssXml() {
  const baseUrl = 'https://nuqs.dev/registry'
  const [registry, error] = await readRegistry()
  if (error || !registry) {
    notFound()
  }
  const items = await Promise.all(
    registry.items.map(async item => {
      return `<item>
      <title>${item.title}</title>
      <link>${baseUrl}/${item.name}</link>
      <guid>${baseUrl}/${item.name}</guid>
      <description>${item.description}</description>
      <pubDate>${(
        await getLastModified(`/src/registry/items/${item.name}.json`)
      ).toUTCString()}</pubDate>
    </item>`
    })
  )
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>@nuqs shadcn registry</title>
    <link>${baseUrl}/registry</link>
    <description>Use the shadcn CLI to install custom parsers, adapters and utilities from the community.</description>
    <atom:link href="http://${baseUrl}/registry/rss.xml" rel="self" type="application/rss+xml" />
  ${items.join('')}
  </channel>
</rss>
`
}
