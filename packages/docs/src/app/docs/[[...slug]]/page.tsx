import { useMDXComponents } from '@/mdx-components'
import { source } from '@/src/app/source'
import { getBaseUrl } from '@/src/lib/url'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lazy, Suspense } from 'react'
import { stat } from 'node:fs/promises'
import { LLMCopyButton, ViewOptions } from '@/src/components/page-actions'
import { buttonVariants } from '@/src/components/ui/button'

type PageProps = {
  params: Promise<{ slug?: string[] }>
}

function PageActionsSkeleton() {
  return (
    <div className="flex flex-row gap-2 items-center">
      <div 
        className={buttonVariants({
          variant: 'secondary',
          size: 'sm',
          className: 'gap-2 animate-pulse w-36'
        })}
      />
      <div 
        className={buttonVariants({
          variant: 'secondary', 
          size: 'sm',
          className: 'gap-2 animate-pulse w-20'
        })}
      />
    </div>
  )
}

export default async function Page(props: PageProps) {
  const { slug } = await props.params
  const page = source.getPage(slug)

  if (page == null) {
    notFound()
  }

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      
      <div className="border-b pb-6">
        <Suspense fallback={<PageActionsSkeleton />}>
          <div className="flex flex-row gap-2 items-center">
            <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
            <ViewOptions
              markdownUrl={`${page.url}.mdx`}
              githubUrl={`https://github.com/47ng/nuqs/blob/dev/packages/docs/content/docs/${page.path}`}
            />
          </div>
        </Suspense>
      </div>

      <DocsBody>
        <MDX components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.getPages().map(page => ({
    slug: page.slugs
  }))
}

export async function generateMetadata(props: PageProps) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    ...(await getSocialImages(page.slugs))
  } satisfies Metadata
}

// --

async function getSocialImages(
  slug: string[]
): Promise<Pick<Metadata, 'openGraph' | 'twitter'>> {
  try {
    const publicImagePath = `${process.cwd()}/public/og/${slug.join('/')}.jpg`
    await stat(publicImagePath) // Does it exist?
    const baseUrl = getBaseUrl()
    return {
      openGraph: {
        type: 'website',
        images: [
          {
            url: `${baseUrl}/og/${slug.join('/')}.jpg`,
            width: 1200,
            height: 675
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        images: [
          {
            url: `${baseUrl}/og/${slug.join('/')}.jpg`,
            width: 1200,
            height: 675
          }
        ]
      }
    }
  } catch {
    console.warn(`No og:image found for doc page \`${slug.join('/')}\``)
    return {}
  }
}
