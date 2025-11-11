import { useMDXComponents } from '@/mdx-components'
import { CodeBlock } from '@/src/components/code-block'
import { H2 } from '@/src/components/typography'
import {
  getRegistryItemCategory,
  readRegistry,
  readRegistryItem,
  readUsage
} from '@/src/registry/read'
import type {
  RegistryBuiltFile,
  RegistryBuiltItem
} from '@/src/registry/schemas'
import { SiTypescript } from '@icons-pack/react-simple-icons'
import { Markdown } from 'fumadocs-core/content'
import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export default async function Page({ params }: PageProps<'/registry/[name]'>) {
  const { name } = await params
  const { title, description, files } =
    await readRegistryItem(name).catch(notFound)
  const usage = await readUsage(name)
  return (
    <DocsPage
      toc={[
        {
          url: '#installation',
          title: 'Installation',
          depth: 0
        },
        ...(usage
          ? [
              {
                url: '#usage',
                title: 'Usage',
                depth: 0
              }
            ]
          : [])
      ]}
    >
      <DocsTitle>{title}</DocsTitle>
      {description && <DocsDescription>{description}</DocsDescription>}
      <DocsBody>
        <H2 id="installation">Installation</H2>
        <Installation name={name} files={files} />
        {usage && (
          <>
            <H2 id="usage">Usage</H2>
            <Markdown
              components={useMDXComponents()}
              rehypePlugins={[rehypeCode]}
            >
              {usage}
            </Markdown>
          </>
        )}
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  const registry = await readRegistry()
  return registry.items.map(item => ({ name: item.name }))
}

export async function generateMetadata({
  params
}: PageProps<'/registry/[name]'>) {
  const { name } = await params
  const item = await readRegistryItem(name)
  return {
    title: item.title,
    description: item.description,
    category: getRegistryItemCategory(name)
  } satisfies Metadata
}

// --

function Installation({
  name,
  files
}: Pick<RegistryBuiltItem, 'name' | 'files'>) {
  return (
    <Tabs items={['CLI', 'Manual']} defaultIndex={0} persist>
      <Tab value="CLI">
        <CodeBlock
          preHighlighted
          code={`<pre><code><span class="line">npx shadcn<span style="color:var(--color-muted-foreground);">@latest</span> add @nuqs/${name}<span/></code></pre>`}
        />
      </Tab>
      <Tab value="Manual">
        {files.map(file => (
          <RegistryBuiltFile key={file.target} {...file} />
        ))}
      </Tab>
    </Tabs>
  )
}

function RegistryBuiltFile({
  target,
  content
}: RegistryBuiltFile & { showTitle?: boolean }) {
  return (
    <CodeBlock
      lang="ts"
      icon={<SiTypescript size={14} />}
      code={content.trim()}
      title={target.replace(/\~\//, '')}
    />
  )
}
