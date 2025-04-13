import { getBlogPosts } from '../_lib/source'

export async function GET() {
  const rssXml = generateRssXml()
  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml'
    }
  })
}

function generateRssXml() {
  const baseUrl = 'https://nuqs.47ng.com'
  const posts = getBlogPosts().filter(post => Boolean(post.data.date))
  const items = posts
    .map(post => {
      return `<item>
      <title>${post.data.title}</title>
      <link>${baseUrl}${post.url}</link>
      <description>${post.data.description}</description>
      <pubDate>${new Date(post.data.date!).toUTCString()}</pubDate>
    </item>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>nuqs</title>
    <link>${baseUrl}/blog</link>
    <description>URL state management with nuqs</description>
    ${items}
  </channel>
</rss>
`
}
