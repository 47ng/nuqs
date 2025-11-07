import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const allowedTags = [
  'github',
  'github-actions-status',
  'npm',
  'npm-version',
  'contributors'
] as const
type Tag = (typeof allowedTags)[number]

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.ISR_TOKEN) {
    console.log('Invalid token `%s`', req.nextUrl.toString())
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  const tag = req.nextUrl.searchParams.get('tag')
  if (!tag || !allowedTags.includes(tag as Tag)) {
    return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
  }
  revalidateTag(tag, 'max')
  return NextResponse.json({
    at: new Date().toISOString(),
    revalidated: tag
  })
}
