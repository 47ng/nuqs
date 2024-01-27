import { Description } from '@/src/components/typography'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import Client from './client'

export const metadata = getMetadata('hex-colors')

export default function HexColorsDemoPage() {
  return (
    <>
      <h1>{metadata.title}</h1>
      <Description>{metadata.description}</Description>
      <Suspense>
        <Client />
      </Suspense>
      <SourceOnGitHub path="hex-colors/client.tsx" />
    </>
  )
}
