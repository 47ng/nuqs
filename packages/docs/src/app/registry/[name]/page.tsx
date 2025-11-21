import { useMDXComponents } from '@/mdx-components'
import { rehypeCodeOptions } from '@/rehype-code.config'
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
import { rehypeCode, remarkHeading } from 'fumadocs-core/mdx-plugins'
import { Callout } from 'fumadocs-ui/components/callout'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import remarkSmartypants from 'remark-smartypants'

export default async function Page({ params }: PageProps<'/registry/[name]'>) {
  const { name } = await params
  const [item, error] = await readRegistryItem(name)
  if (error || !item) {
    notFound()
  }
  const { title, description, files } = item
  const category = getRegistryItemCategory(name)
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
              remarkPlugins={[remarkSmartypants, remarkHeading]}
              rehypePlugins={[[rehypeCode, rehypeCodeOptions]]}
            >
              {usage}
            </Markdown>
          </>
        )}
        {category === 'Adapters' && (
          <>
            <br />
            <Callout type="warn">
              <p>
                The custom adapters APIs are not yet stable and may change in
                the future in a minor or patch release (not following SemVer).
              </p>
              <p>
                Use the registry's <a href="/registry/rss.xml">RSS feed</a> to
                stay updated on any changes.
              </p>
            </Callout>
          </>
        )}
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  const [registry, error] = await readRegistry()
  if (error || !registry) {
    notFound()
  }
  return registry.items.map(item => ({ name: item.name }))
}

export async function generateMetadata({
  params
}: PageProps<'/registry/[name]'>) {
  const { name } = await params
  const [item, error] = await readRegistryItem(name)
  if (error || !item) {
    notFound()
  }
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
