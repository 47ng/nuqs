import type { ReactNode } from 'react'

type AudienceProps = {
  children?: ReactNode
}

/**
 * Content that is only shown to humans viewing the HTML docs.
 * Hidden from LLMs (llms-full.txt and .md endpoints) via the remark-audience plugin.
 */
export function HumanContent({ children }: AudienceProps) {
  return <>{children}</>
}

/**
 * Content that is only shown to LLMs (llms-full.txt and .mdx endpoints).
 * Hidden from humans viewing the HTML docs.
 */
export function LLMContent(_props: AudienceProps) {
  return null
}
