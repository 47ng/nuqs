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
      <guid>${baseUrl}${post.url}</guid>
      <description>${post.data.description}</description>
      <pubDate>${new Date(post.data.date!).toUTCString()}</pubDate>
    </item>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>nuqs</title>
    <link>${baseUrl}/blog</link>
    <description>URL state management with nuqs</description>
    <atom:link href="http://${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
  ${items}
  </channel>
</rss>
`
}
