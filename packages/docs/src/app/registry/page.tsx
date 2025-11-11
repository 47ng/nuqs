import { H2 } from '@/src/components/typography'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import type { Metadata } from 'next'

export const metadata = {
  title: 'Shadcn Registry',
  description:
    'Use the shadcn CLI to install custom parsers, adapters and utilities from the community.'
} satisfies Metadata

export default function Page() {
  return (
    <DocsPage>
      <DocsTitle>Shadcn Registry</DocsTitle>
      <DocsDescription>
        Use the <a href="https://ui.shadcn.com/docs/cli">shadcn CLI</a> to
        install custom parsers, adapters and utilities from the community.
      </DocsDescription>
      <DocsBody>
        <H2 id="using-the-registry">Using the registry</H2>
        <p>
          Follow the CLI instructions for each item to add it to your project,
          or copy-paste the code snippets directly.
        </p>
        <H2 id="mcp-server">MCP Server</H2>
        <p>
          Shadcn registries come with an{' '}
          <a href="https://ui.shadcn.com/docs/mcp">MCP server</a> that you can
          use
        </p>
      </DocsBody>
    </DocsPage>
  )
}
