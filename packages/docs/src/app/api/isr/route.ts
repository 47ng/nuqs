import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const ACCEPTED_TAGS = ['github', 'github-actions-status', 'npm', 'contributors']

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.ISR_TOKEN) {
    console.log('Invalid token `%s`', req.nextUrl.toString())
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  const now = new Date()
  const tag = req.nextUrl.searchParams.get('tag')
  if (!tag || !ACCEPTED_TAGS.includes(tag)) {
    return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
  }
  revalidateTag(tag)
  return NextResponse.json({
    at: now.toISOString(),
    revalidated: tag
  })
}
