import { getPage, pages } from '@/src/app/source'
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
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {page.matter.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {page.matter.description}
          </p>
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
