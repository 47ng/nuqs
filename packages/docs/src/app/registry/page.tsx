import { H2 } from '@/src/components/typography'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import { RssIcon } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata = {
  title: 'Shadcn Registry',
  description:
    'Use the shadcn CLI to install custom parsers, adapters and utilities from the community.'
} satisfies Metadata

export default function Page() {
  return (
    <DocsPage>
      <nav className="mb-4 flex items-center justify-between">
        <DocsTitle>Shadcn Registry</DocsTitle>
        <RssFeedLink />
      </nav>
      <DocsDescription>
        Use the{' '}
        <a href="https://ui.shadcn.com/docs/cli" className="underline">
          shadcn CLI
        </a>{' '}
        to install custom parsers, adapters and utilities from the community.
      </DocsDescription>
      <DocsBody>
        <H2 id="using-the-registry">Using the registry</H2>
        <p>
          Follow the CLI instructions for each item to add it to your project,
          or copy-paste the code snippets directly.
        </p>
        {/* <H2 id="mcp-server">MCP Server</H2>
        <p>
          Shadcn registries come with an{' '}
          <a href="https://ui.shadcn.com/docs/mcp">MCP server</a> that you can
          use
        </p> */}
        <H2 id="rss-feed">Staying up to date</H2>
        <p>
          Subscribe to the registry's <a href="/registry/rss.xml">RSS feed</a>{' '}
          to stay updated on the latest changes and additions to the registry.
        </p>
      </DocsBody>
    </DocsPage>
  )
}

function RssFeedLink() {
  return (
    <a
      href="/registry/rss.xml"
      className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
    >
      <RssIcon
        className="size-4 text-orange-600 dark:text-orange-400"
        role="presentation"
      />
      RSS
    </a>
  )
}
