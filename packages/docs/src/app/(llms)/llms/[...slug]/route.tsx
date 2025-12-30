import { source } from '@/src/app/source'
import { getLLMText } from '@/src/lib/get-llm-text'
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

  return new NextResponse(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown'
    }
  })
}

export function generateStaticParams() {
  return source.generateParams()
}
