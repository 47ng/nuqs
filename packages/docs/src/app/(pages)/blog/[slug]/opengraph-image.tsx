import { blog } from '@/src/app/source'
import { generateOpengraphImage, size } from '@/src/components/og-image'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Image metadata
export { contentType, size } from '@/src/components/og-image'
export const dynamic = 'force-static'

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const pages = blog.getPages()
  const slugs = new Set(pages.flatMap(page => page.slugs))
  return Array.from(slugs).map(slug => ({ slug }))
}

// Image generation
export default async function Image({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const page = blog.getPage([slug])
  if (!page) notFound()
  const customImage = await getCustomImage(slug)
  if (customImage) {
    return new ImageResponse(
      (
        <img
          src={customImage}
          alt="Open Graph Image"
          style={{
            position: 'absolute',
            inset: 0
          }}
        />
      ),
      size
    )
  }
  // Fallback to generated image
  return generateOpengraphImage({
    title: page.data.title,
    description: page.data.description
  })
}

// --

async function getCustomImage(slug: string) {
  const filePath = join(process.cwd(), 'content/blog/' + slug + '.og.png')
  try {
    const imageBuffer = await readFile(filePath)
    return 'data:image/png;base64,' + imageBuffer.toString('base64')
  } catch {
    return null
  }
}
