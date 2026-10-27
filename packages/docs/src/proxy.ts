import { createGeoProxy } from '@usenotra/geo/next'
import { after, NextResponse } from 'next/server'

const geo = createGeoProxy({
  token: process.env.NOTRA_GEO_TOKEN!,
  endpoint: 'https://ingest.usenotra.com'
})

export function proxy(request: Request) {
  after(() => geo(request, { waitUntil: after }))
  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/|_vercel/|api/|(?!(?:.*/)?llms(?:-full)?\\.txt$).*\\.(?:avif|css|eot|gif|ico|jpeg|jpg|js|json|map|mjs|mp3|mp4|otf|pdf|png|svg|ttf|txt|wasm|webm|webmanifest|webp|woff|woff2|xml|zip)$).*)',
      missing: [
        { type: 'header', key: 'rsc' },
        { type: 'header', key: 'next-router-prefetch' }
      ]
    }
  ]
}
