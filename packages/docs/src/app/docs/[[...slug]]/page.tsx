import { useMDXComponents } from '@/mdx-components'
import { source } from '@/src/app/source'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { stat } from 'node:fs/promises'

type PageProps = {
  params: Promise<{ slug?: string[] }>
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
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...useMDXComponents({}) }} />
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
    const baseUrl =
      process.env.VERCEL_ENV === 'production'
        ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL
        : process.env.VERCEL_URL
          ? 'https://' + process.env.VERCEL_URL
          : ''
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
