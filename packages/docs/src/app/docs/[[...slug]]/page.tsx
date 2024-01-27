import { getPage, pages } from '@/src/app/source'
import { Description, H1 } from '@/src/components/typography'
import type { Metadata } from 'next'
import { DocsBody, DocsPage } from 'next-docs-ui/page'
import { notFound } from 'next/navigation'

export default async function Page({
  params
}: {
  params: { slug?: string[] }
}) {
  const page = getPage(params.slug)

  if (page == null) {
    notFound()
  }

  const MDX = page.data.default

  return (
    <DocsPage url={page.url} toc={page.data.toc}>
      <DocsBody>
        <div className="not-prose mb-12">
          <H1>{page.matter.title}</H1>
          <Description>{page.matter.description}</Description>
        </div>
        <MDX />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return pages.map(page => ({
    slug: page.slugs
  }))
}

export function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = getPage(params.slug)

  if (page == null) notFound()

  return {
    title: page.matter.title,
    description: page.matter.description
  } satisfies Metadata
}
