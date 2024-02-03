import type { MDXComponents } from 'mdx/types'
import { Callout } from 'next-docs-ui/components/callout'
import defaultComponents from 'next-docs-ui/mdx/default'
import { Suspense } from 'react'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
    Callout,
    Suspense
  }
}
