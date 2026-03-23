import { source } from '@/src/app/source'
import { getLLMText, llmFooter } from '@/src/lib/get-llm-text'
import { notFound } from 'next/navigation'
import { type NextRequest, NextResponse } from 'next/server'

export const revalidate = false

export async function GET(
  _req: NextRequest,
  { params }: RouteContext<'/llms/[...slug]'>
) {
  const slug = (await params).slug
  const page = source.getPage(slug)
  if (!page) notFound()

  const text = await getLLMText(page)
  return new NextResponse(`${text}\n${llmFooter}\n`, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8'
    }
  })
}

export function generateStaticParams() {
  return source.generateParams()
}
