import { generateOpengraphImage } from '@/src/components/og-image'
import { readRegistry, readRegistryItem } from '@/src/registry/read'
import { notFound } from 'next/navigation'

// Image metadata
export { contentType, size } from '@/src/components/og-image'
export const dynamic = 'force-static'

export async function generateStaticParams(): Promise<{ name: string }[]> {
  const [registry, error] = await readRegistry()
  if (error || !registry) {
    notFound()
  }
  return registry.items.map(item => ({ name: item.name }))
}

// Image generation
export default async function Image({ params }: PageProps<'/registry/[name]'>) {
  const { name } = await params
  const [item, error] = await readRegistryItem(name).catch(notFound)
  if (error || !item) {
    notFound()
  }
  return generateOpengraphImage({
    title: item.title,
    description: item.description
  })
}
