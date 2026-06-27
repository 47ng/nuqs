import { Description, H1 } from '@/src/components/typography'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import Client from './client'

export const metadata = getMetadata('batching')

export default function BuilderPatternDemoPage() {
  return (
    <>
      <H1 className="text-foreground my-4 text-3xl font-bold sm:text-4xl">
        {metadata.title}
      </H1>
      <Description className="mb-4">{metadata.description}</Description>
      <Suspense>
        <Client />
      </Suspense>
      <SourceOnGitHub path="batching/client.tsx" />
    </>
  )
}
