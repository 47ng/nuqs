import { getChangelogMarkdown } from '@/src/app/docs/changelog/_lib'
import { llmFooter } from '@/src/lib/get-llm-text'
import { NextResponse } from 'next/server'

export const revalidate = false

export async function GET() {
  const markdown = await getChangelogMarkdown()
  return new NextResponse(`${markdown}\n\n${llmFooter}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8'
    }
  })
}
