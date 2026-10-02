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
