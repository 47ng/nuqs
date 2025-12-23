import { Description } from '@/src/components/typography'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import Client from './client'

export const metadata = getMetadata('tic-tac-toe')

export default function Page() {
  return (
    <>
      <h1 className="text-foreground my-4 text-3xl font-bold sm:text-4xl">
        {metadata.title}
      </h1>
      <Description>{metadata.description}</Description>
      <section className="my-12 flex flex-col items-start gap-4">
        <Suspense>
          <Client />
        </Suspense>
      </section>
      <SourceOnGitHub path="tic-tac-toe/client.tsx" />
    </>
  )
}
