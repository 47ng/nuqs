import { Description, H1 } from '@/src/components/typography'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import Client from './client'

export const metadata = getMetadata('basic-counter')

export default function BasicCounterDemoPage() {
  return (
    <>
      <H1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
        {metadata.title}
      </H1>
      <Description>{metadata.description}</Description>
      <Suspense>
        <Client />
      </Suspense>
      <SourceOnGitHub path="basic-counter/client.tsx" />
    </>
  )
}
