import { useMDXComponents } from '@/mdx-components'
import { AsideSponsors } from '@/src/app/(pages)/_landing/sponsors'
import { source } from '@/src/app/source'
import {
  CopyAsMarkdownButton,
  CopyMarkdownUrlButton,
  ViewOptions
} from '@/src/components/ai/page-actions'
import { getBaseUrl } from '@/src/lib/url'
import { github } from '@/src/lib/utils'
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { stat } from 'node:fs/promises'

export const dynamic = 'force-static'

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params
  const page = source.getPage(slug)

  // Return 404 for missing pages or llm-only pages
  if (!page || !page.data.exposeTo.includes('user')) {
    notFound()
  }

  const MDX = page.data.body

  return (
    <DocsPage
      toc={page.data.toc}
      tableOfContent={{
        footer: <AsideSponsors />
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <p className="text-fd-muted-foreground mb-2 text-lg">
        {page.data.description}
      </p>
      <div className="flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <CopyAsMarkdownButton markdownUrl={`${page.url}.md`} />
        <CopyMarkdownUrlButton markdownUrl={`${page.url}.md`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/${github.owner}/${github.repo}/blob/${github.branch}/packages/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source
    .getPages()
    .filter(page => page.data.exposeTo.includes('user'))
    .map(page => ({
      slug: page.slugs
    }))
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page || !page.data.exposeTo.includes('user')) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    ...(await getSocialImages(page.slugs))
  }
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
