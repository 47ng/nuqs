import {
  CodeBlock as FumaDocsCodeBlock,
  Pre
} from 'fumadocs-ui/components/codeblock'
import type { CodeBlockProps } from './code-block-defs'
import { highlight } from './code-block-highlighter'

export async function CodeBlock({
  code,
  lang = 'tsx',
  compact = false,
  preHighlighted = false,
  ...props
}: CodeBlockProps) {
  const highlighted = preHighlighted ? code : await highlight(code, lang)
  return (
    <FumaDocsCodeBlock
      // @ts-expect-error
      custom={compact ? 'compact' : undefined}
      {...props}
    >
      <Pre className="px-2" dangerouslySetInnerHTML={{ __html: highlighted }} />
    </FumaDocsCodeBlock>
  )
}
