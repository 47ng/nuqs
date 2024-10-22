import { blog } from '@/src/app/source'
import { Description, H1 } from '@/src/components/typography'
// import { createMetadata } from '@/utils/metadata'
import { InlineTOC } from 'fumadocs-ui/components/inline-toc'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export default async function Page(props: {
  params: Promise<{ slug: string }>
}): Promise<React.ReactElement> {
  const params = await props.params
  const page = blog.getPage([params.slug])

  if (!page) notFound()

  return (
    <>
      <div className="container py-12 md:px-8">
        <H1>{page.data.title}</H1>
        <Description>{page.data.description}</Description>
      </div>
      <article className="container flex flex-col px-0 py-8 lg:flex-row lg:px-4">
        <div className="prose min-w-0 flex-1 p-4">
          <InlineTOC items={page.data.toc} />
          <page.data.body components={defaultMdxComponents} />
        </div>
        <div className="flex flex-col gap-4 border-l p-4 text-sm lg:w-[250px]">
          <div>
            <p className="mb-1 text-fd-muted-foreground">Written by</p>
            <p className="font-medium">{page.data.author}</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-fd-muted-foreground">At</p>
            <p className="font-medium">
              {new Date(page.data.date ?? page.file.name).toDateString()}
            </p>
          </div>
        </div>
      </article>
    </>
  )
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const params = await props.params
  const page = blog.getPage([params.slug])

  if (!page) notFound()

  // todo: Add og:images etc
  return {
    title: page.data.title,
    description:
      page.data.description ??
      'Type-safe search params state manager for React frameworks'
  }
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map(page => ({
    slug: page.slugs[0]
  }))
}
