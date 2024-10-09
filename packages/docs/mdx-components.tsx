import { Callout } from 'fumadocs-ui/components/callout'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Suspense } from 'react'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    Callout,
    Suspense
  }
}
