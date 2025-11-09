import { useMDXComponents } from '@/mdx-components'
import { CodeBlock } from '@/src/components/code-block'
import { readRegistry, readRegistryItem, readUsage } from '@/src/registry/read'
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
import { Link } from 'lucide-react'
import type { Metadata } from 'next'
import NextLink from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Shadcn Registry',
  description:
    'Use the shadcn CLI to install custom parsers, adapters and utilities from the community.'
} satisfies Metadata

export default async function Page() {
  const registry = await readRegistry()
  return (
    <DocsPage
      toc={registry.items.map(item => ({
        title: item.title,
        url: `#${item.name}`,
        depth: 1
      }))}
    >
      <DocsTitle>Shadcn Registry</DocsTitle>
      <DocsDescription>
        Use the <a href="https://ui.shadcn.com/docs/cli">shadcn CLI</a> to
        install custom parsers, adapters and utilities from the community.
      </DocsDescription>
      <DocsBody>
        {registry.items.map(item => (
          <RegistryItem key={item.name} name={item.name} />
        ))}
      </DocsBody>
    </DocsPage>
  )
}

// --

export async function RegistryItem({ name }: Pick<RegistryBuiltItem, 'name'>) {
  const { title, description, files } = await readRegistryItem(name)
  const usage = await readUsage(name)
  return (
    <section className="group">
      <h2 id={name} className="group-first-of-type:mt-0">
        {title}
        <NextLink href={`#${name}`}>
          <Link className="ml-2 hidden size-[0.75em] opacity-75 group-hover:inline-block" />
        </NextLink>
      </h2>
      {description && (
        <Markdown components={useMDXComponents()} rehypePlugins={[rehypeCode]}>
          {description}
        </Markdown>
      )}
      <Installation name={name} files={files} />
      {usage && (
        <>
          <h3>Usage</h3>
          <Markdown
            components={useMDXComponents()}
            rehypePlugins={[rehypeCode]}
          >
            {usage}
          </Markdown>
        </>
      )}
    </section>
  )
}

// --

function Installation({
  name,
  files
}: Pick<RegistryBuiltItem, 'name' | 'files'>) {
  return (
    <>
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
    </>
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
