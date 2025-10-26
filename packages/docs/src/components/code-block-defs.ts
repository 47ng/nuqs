import type { CodeBlockProps as FumaDocsCodeBlockProps } from 'fumadocs-ui/components/codeblock'
import type { BundledLanguage } from 'shiki/bundle/web'

export type { BundledLanguage }

export type CodeBlockProps = Omit<FumaDocsCodeBlockProps, 'children'> & {
  code: string
  preHighlighted?: boolean
  compact?: boolean
  lang?: BundledLanguage
}
