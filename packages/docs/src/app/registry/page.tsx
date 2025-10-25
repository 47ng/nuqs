import { useMDXComponents } from '@/mdx-components'
import { CodeBlock } from '@/src/components/code-block'
import { SiTypescript } from '@icons-pack/react-simple-icons'
import { Markdown } from 'fumadocs-core/content'
import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { Link } from 'lucide-react'
import NextLink from 'next/link'
import { readRegistry, readRegistryItem, readUsage } from './_lib/read'
import type { RegistryFile, RegistryItem } from './_lib/schemas'

export default async function Page() {
  const registry = await readRegistry()
  return (
    <>
      <h1>Shadcn Registry</h1>
      <p>
        You can use the <a href="https://ui.shadcn.com/docs/cli">shadcn CLI</a>{' '}
        to install custom parsers, adapters and utilities from the community.
      </p>
      {registry.items.map(item => (
        <RegistryItem key={item.name} name={item.name} />
      ))}
    </>
  )
}

// --

export async function RegistryItem({ name }: Pick<RegistryItem, 'name'>) {
  const { title, description, files } = await readRegistryItem(name)
  const usage = await readUsage(name)
  return (
    <section>
      <h2 id={name} className="group">
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
            lang="shell"
            code={`npx shadcn@latest add https://nuqs.dev/${name}.json`}
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
