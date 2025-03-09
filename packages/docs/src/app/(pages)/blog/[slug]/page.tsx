import { blog } from '@/src/app/source'
// import { createMetadata } from '@/utils/metadata'
import Footer from '@/src/app/(pages)/_landing/footer'
import { Description } from '@/src/components/typography'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Logo as Logo47ng } from './_components/47ng'

export default async function Page(props: {
  params: Promise<{ slug: string }>
}): Promise<React.ReactElement> {
  const params = await props.params
  const page = blog.getPage([params.slug])

  if (!page) notFound()

  return (
    <>
      <div className="container max-w-[900px] py-12 md:px-8">
        <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
          {page.data.title}
        </h1>
        <Description>{page.data.description}</Description>
      </div>
      <div className="container flex max-w-[900px] flex-col gap-4 px-4 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <a
          href="https://bsky.app/profile/francoisbest.com"
          className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-foreground/5"
          aria-description="Author"
        >
          <Logo47ng size={8} />
          <div>
            <p className="font-semibold">François Best</p>
            <p className="text-xs text-fd-muted-foreground">
              @francoisbest.com
            </p>
          </div>
        </a>
        {page.data.date && (
          <p className="text-sm font-medium text-fd-muted-foreground">
            {new Date(page.data.date).toLocaleDateString('en-GB', {
              dateStyle: 'full'
            })}
          </p>
        )}
      </div>
      <div className="container max-w-[900px] px-0 lg:px-8">
        <hr className="my-4" />
      </div>
      <article className="container max-w-[900px] px-0 pb-24 pt-8 lg:px-4">
        {/* <InlineTOC items={page.data.toc} /> */}
        <div className="prose min-w-0 flex-1 p-4">
          <page.data.body components={defaultMdxComponents} />
        </div>
      </article>
      <Footer />
    </>
  )
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const page = blog.getPage([slug])

  if (!page) notFound()

  // todo: Add og:images etc
  return {
    title: page.data.title,
    description:
      page.data.description ??
      'Type-safe search params state manager for React frameworks'
  }
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return blog.getPages().map(page => ({
    slug: page.slugs[0]
  }))
}
