import { Description, H1 } from '@/src/components/typography'
import { Card } from 'next-docs-ui/mdx/card'
import { demos } from './(demos)/demos'

export const metadata = {
  title: 'Playground',
  description: 'Examples and demos of nuqs in action.'
}

export default function PlaygroundIndexPage() {
  return (
    <main className="py-6 md:py-10">
      <H1>{metadata.title}</H1>
      <Description>{metadata.description}</Description>
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
    </main>
  )
}
