import { HumanContent, LLMContent } from '@/src/components/audience'
import { FeatureSupportMatrix } from '@/src/components/feature-support-matrix'
import { Callout } from 'fumadocs-ui/components/callout'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Suspense } from 'react'

declare module 'mdx/types.js' {
  // Augment the MDX types to make it understand React.
  namespace JSX {
    type Element = React.JSX.Element
    type ElementClass = React.JSX.ElementClass
    type ElementType = React.JSX.ElementType
    type IntrinsicElements = React.JSX.IntrinsicElements
  }
}

const components = {
  ...defaultMdxComponents,
  Callout,
  FeatureSupportMatrix,
  HumanContent,
  LLMContent,
  Suspense,
  Tab,
  Tabs,
  pre: ({ ref: _ref, children, ...props }) => (
    <CodeBlock {...props}>
      <Pre>{children}</Pre>
    </CodeBlock>
  )
} satisfies MDXComponents

declare global {
  type MDXProvidedComponents = typeof components
}

export function useMDXComponents(): MDXProvidedComponents {
  return components
}
