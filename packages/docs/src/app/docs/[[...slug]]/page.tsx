import { getPage, pages } from '@/src/app/source'
import { Description, H1 } from '@/src/components/typography'
import type { Metadata } from 'next'
import { DocsBody, DocsPage } from 'next-docs-ui/page'
import { notFound } from 'next/navigation'
import { stat } from 'node:fs/promises'

type PageProps = {
  params: { slug?: string[] }
}

export default async function Page({ params }: PageProps) {
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

export async function generateMetadata({ params }: PageProps) {
  const page = getPage(params.slug)
  if (page == null) notFound()

  return {
    title: page.matter.title,
    description: page.matter.description,
    ...(await getSocialImages(page.slugs))
  } satisfies Metadata
}

// --

async function getSocialImages(
  slug: string[]
): Promise<Pick<Metadata, 'openGraph' | 'twitter'>> {
  try {
    const publicImagePath = `${process.cwd()}/public/og/${slug.join('/')}.jpg`
    console.log(publicImagePath)
    await stat(publicImagePath) // Does it exist?
    return {
      openGraph: {
        type: 'website',
        images: [
          {
            url: `/og/${slug.join('/')}.jpg`,
            width: 1200,
            height: 675
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        images: [
          {
            url: `/og/${slug.join('/')}.jpg`,
            width: 1200,
            height: 675
          }
        ]
      }
    }
  } catch (error) {
    console.error(error)
    console.warn(`No og:image found for doc page \`${slug.join('/')}\``)
    return {}
  }
}
