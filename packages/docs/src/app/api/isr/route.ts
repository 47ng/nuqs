import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// https://nextjs.org/docs/app/api-reference/functions/cacheLife#reference
const tagsAndCacheLife = {
  github: 'minutes', // Repository & stargazers
  'github-actions-status': 'hours',
  npm: 'hours',
  contributors: 'hours'
} as const
type Tag = keyof typeof tagsAndCacheLife

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== process.env.ISR_TOKEN) {
    console.log('Invalid token `%s`', req.nextUrl.toString())
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  const tag = req.nextUrl.searchParams.get('tag')
  if (!tag || !Object.keys(tagsAndCacheLife).includes(tag)) {
    return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
  }
  revalidateTag(tag, tagsAndCacheLife[tag as Tag] ?? 'max')
  return NextResponse.json({
    at: new Date().toISOString(),
    revalidated: tag
  })
}
