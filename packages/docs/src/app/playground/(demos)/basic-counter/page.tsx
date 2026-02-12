import { DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import Client from './client'

export const metadata = getMetadata('basic-counter')

export default function BasicCounterDemoPage() {
  return (
    <>
      <DocsTitle>{metadata.title}</DocsTitle>
      <DocsDescription>{metadata.description}</DocsDescription>
      <DocsBody>
        <Suspense>
          <Client />
        </Suspense>
        <SourceOnGitHub path="basic-counter/client.tsx" />
      </DocsBody>
    </>
  )
}
