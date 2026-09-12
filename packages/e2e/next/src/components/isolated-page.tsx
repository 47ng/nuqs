import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import type { ReactElement, ReactNode } from 'react'

/**
 * This marks a page with its own adapter, so _app skips the unflagged adapter.
 * An outer adapter registers its own router event listeners.
 * Those listeners can hide a broken isolated bridge.
 */
export type IsolatedPage = {
  skipNuqsAdapter: true
}

/**
 * This builds a pages-router page with its own flagged adapter.
 * The caller hoists its render-stable subtree to module scope.
 * The pages router re-renders top-down on each route state change.
 * React can bail out, keeping RouterContext re-renders inside the bridge.
 * See the experimental_keyIsolation prop docs.
 */
export function createIsolatedPage(
  children: ReactNode
): (() => ReactElement) & IsolatedPage {
  const content = (
    <NuqsAdapter experimental_keyIsolation>{children}</NuqsAdapter>
  )
  const Page = () => content
  Page.skipNuqsAdapter = true as const
  return Page
}
