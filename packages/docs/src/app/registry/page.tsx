import { useMDXComponents } from '@/mdx-components'
import { CodeBlock } from '@/src/components/code-block'
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
import NextLink from 'next/link'
import { readRegistry, readRegistryItem, readUsage } from './_lib/read'
import type { RegistryFile, RegistryItem } from './_lib/schemas'

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

export async function RegistryItem({ name }: Pick<RegistryItem, 'name'>) {
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
      {description && <p>{description}</p>}
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

function Installation({ name, files }: Pick<RegistryItem, 'name' | 'files'>) {
  return (
    <>
      <Tabs items={['CLI', 'Manual']} defaultIndex={0} persist>
        <Tab value="CLI">
          <CodeBlock
            preHighlighted
            code={`<pre><div class="px-1">npx shadcn<span class="text-muted-foreground">@latest</span> add <span class="text-muted-foreground">https://</span>nuqs.dev/r/${name}<span class="text-muted-foreground">.json</span><div/></pre>`}
          />
        </Tab>
        <Tab value="Manual">
          {files.map(file => (
            <RegistryFile key={file.target} {...file} />
          ))}
        </Tab>
      </Tabs>
    </>
  )
}

function RegistryFile({
  target,
  content
}: RegistryFile & { showTitle?: boolean }) {
  return (
    <CodeBlock
      lang="ts"
      icon={<SiTypescript size={14} />}
      code={content.trim()}
      title={target.replace(/\~\//, '')}
    />
  )
}
