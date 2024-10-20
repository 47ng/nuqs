'use client'

import {
  CodeBlock as FumaDocsCodeBlock,
  Pre
} from 'fumadocs-ui/components/codeblock'
import { use, useEffect, useState } from 'react'
import type { CodeBlockProps } from './code-block-defs'

// For some reason, importing this directly causes a build error:
// Error: Element type is invalid: expected a string (for built-in components)
// or a class/function (for composite components) but got: undefined.
const importHighlight = import('./code-block-highlighter')

export function CodeBlock({
  code,
  lang = 'tsx',
  compact = false,
  ...props
}: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const { highlight, renderCodeSkeleton } = use(importHighlight)
  useEffect(() => {
    ;(async () => {
      const x = await highlight(code, lang)
      setHtml(x)
    })()
  }, [code, lang, highlight])
  return (
    <FumaDocsCodeBlock
      // @ts-expect-error
      custom={compact ? 'compact' : undefined}
      {...props}
    >
      <Pre
        dangerouslySetInnerHTML={{
          __html: html ?? renderCodeSkeleton(code)
        }}
      />
    </FumaDocsCodeBlock>
  )
}
