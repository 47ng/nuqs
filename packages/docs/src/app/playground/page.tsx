import { Card } from 'fumadocs-ui/components/card'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import { demos } from './(demos)/demos'

export const metadata = {
  title: 'Playground',
  description: 'Examples and demos of nuqs in action.'
}

export default function PlaygroundIndexPage() {
  return (
    <DocsPage>
      <DocsTitle>{metadata.title}</DocsTitle>
      <DocsDescription>{metadata.description}</DocsDescription>
      <DocsBody>
        <h2 className="sr-only">Examples</h2>
        <ul className="not-prose my-8 space-y-2">
          {Object.entries(demos).map(([path, { title, description }]) => (
            <li key={path}>
              <Card
                title={title}
                description={description}
                href={`/playground/${path}`}
              />
            </li>
          ))}
        </ul>
      </DocsBody>
    </DocsPage>
  )
}
