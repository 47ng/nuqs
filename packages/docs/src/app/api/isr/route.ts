import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

const ACCEPTED_TAGS = [
  'github',
  'github-actions-status',
  'npm-stats',
  'contributors',
  'releases'
]

// Constant-time string compare. The length is allowed to leak (timingSafeEqual
// requires equal-length buffers), but the byte comparison doesn't short-circuit.
function tokensMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const expected = process.env.ISR_TOKEN
  // Reject a missing/empty configured token outright, so an unset ISR_TOKEN
  // can't be matched by an empty `?token=`.
  if (!expected || !token || !tokensMatch(token, expected)) {
    // Log the requested token for analysis (sliced to avoid flooding logs)
    console.log('Invalid token `%s`', token?.slice(0, 256))
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const tag = req.nextUrl.searchParams.get('tag')
  if (!tag || !ACCEPTED_TAGS.includes(tag)) {
    return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
  }
  revalidateTag(tag, 'max')
  return NextResponse.json({
    at: new Date().toISOString(),
    revalidated: tag
  })
}
