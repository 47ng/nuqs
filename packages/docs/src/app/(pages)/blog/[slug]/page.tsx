import { blog } from '@/src/app/source'
// import { createMetadata } from '@/utils/metadata'
import { PageFooter } from '@/src/app/(pages)/_landing/page-footer'
import { Description } from '@/src/components/typography'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/src/components/ui/breadcrumb'
import { SiBluesky, SiGithub } from '@icons-pack/react-simple-icons'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Author } from './_components/author'

export default async function Page(props: {
  params: Promise<{ slug: string }>
}): Promise<React.ReactElement> {
  const params = await props.params
  const page = blog.getPage([params.slug])

  if (!page) notFound()
  const blueskyShareIntent = encodeURIComponent(
    `"${page.data.title}" by @francoisbest.com on the @nuqs.dev blog • https://nuqs.dev/blog/${params.slug}`
  )

  return (
    <>
      <Breadcrumb className="container mt-8 max-w-[900px] md:px-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/blog">Blog</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{page.data.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="container max-w-[900px] py-12 md:px-8">
        <h1 className="text-foreground mb-4 text-4xl font-bold sm:text-5xl">
          {page.data.title}
        </h1>
        <Description>{page.data.description}</Description>
      </div>
      <div className="container flex max-w-[900px] flex-col gap-4 px-4 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Author />
        {page.data.date && (
          <p className="text-fd-muted-foreground text-sm font-medium">
            {new Date(page.data.date).toLocaleDateString('en-GB', {
              dateStyle: 'long'
            })}
          </p>
        )}
      </div>
      <div className="container max-w-[900px] px-0 lg:px-8">
        <hr className="my-4" />
      </div>
      <article className="container max-w-[900px] px-0 pt-8 pb-24 lg:px-4">
        <div className="prose min-w-0 flex-1 p-4">
          <page.data.body components={defaultMdxComponents} />
        </div>
      </article>
      <nav
        aria-label="Share this post"
        className="container flex max-w-[900px] items-center justify-center gap-4 px-0 pb-24 lg:px-4"
      >
        <a
          href={`https://github.com/47ng/nuqs/edit/next/packages/docs/content/blog/${params.slug}.mdx`}
          className="flex items-center gap-1.5 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiGithub role="presentation" className="size-4" />
          Edit on GitHub
        </a>
        <span aria-hidden>•</span>
        <a
          href={`https://bsky.app/intent/compose?text=${blueskyShareIntent}`}
          className="flex items-center gap-1.5 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiBluesky role="presentation" className="size-4" />
          Comment on Bluesky
        </a>
      </nav>
      <PageFooter />
    </>
  )
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const page = blog.getPage([slug])

  if (!page) notFound()

  return {
    title: page.data.title,
    description:
      page.data.description ??
      'Type-safe search params state manager for React frameworks',
    alternates: {
      types: {
        'application/rss+xml': [
          {
            url: '/blog/rss.xml',
            title: 'nuqs blog RSS feed'
          }
        ]
      }
    }
  }
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return blog.getPages().map(page => ({
    slug: page.slugs[0]
  }))
}
