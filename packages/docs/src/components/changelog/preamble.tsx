import { useMDXComponents } from '@/mdx-components'
import { rehypeCodeOptions } from '@/rehype-code.config'
import { Markdown } from 'fumadocs-core/content'
import { rehypeCode, remarkHeading } from 'fumadocs-core/mdx-plugins'
import remarkSmartypants from 'remark-smartypants'

export type PreambleProps = {
  markdown: string
}

// The docs-only preamble: maintainer-authored markdown carried in the release
// body's hidden `<changelog:preamble>` block, surfaced above the change list.
// Rendered through the same remark → hast → jsx pipeline (fumadocs' `Markdown`)
// and MDX component set as the rest of the docs, so links, code fences and
// callouts look identical to authored docs prose — and, unlike the change list,
// it keeps the surrounding `DocsBody` prose styles (no `not-prose`). This is the
// ONLY body content docs renders: the visible GitHub notes prose is never shown
// here. The caller renders nothing when the preamble is empty/whitespace (the
// codec already resolves that to null).
export function Preamble({ markdown }: PreambleProps) {
  return (
    <Markdown
      components={useMDXComponents()}
      remarkPlugins={[remarkSmartypants, remarkHeading]}
      rehypePlugins={[[rehypeCode, rehypeCodeOptions]]}
    >
      {markdown}
    </Markdown>
  )
}
