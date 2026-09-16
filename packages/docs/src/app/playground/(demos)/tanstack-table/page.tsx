import { Description } from '@/src/components/typography'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import Client from './client'

export const metadata = getMetadata('tanstack-table')

export default function Page() {
  return (
    <>
      <h1>{metadata.title}</h1>
      <Description>{metadata.description}</Description>
      <section className="my-12 flex flex-col items-start gap-4">
        <Suspense>
          <Client />
        </Suspense>
      </section>
      <SourceOnGitHub path="tanstack-table/client.tsx" />
      <SourceOnGitHub path="tanstack-table/api.ts" />
    </>
  )
}
