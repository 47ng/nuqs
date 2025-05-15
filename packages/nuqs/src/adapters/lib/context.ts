import { map } from 'nanostores'
import { debugEnabled } from '../../debug'
import { error } from '../../errors'
import type { UseAdapterHook } from './defs'
import { createElement, Fragment, type ReactNode } from 'react'

export type AdapterContext = {
  useAdapter: UseAdapterHook
}

// Create a Nanostore to hold the adapter reference
export const context = map<AdapterContext>({
  useAdapter: () => {
    throw new Error(error(404))
  }
})

declare global {
  interface Window {
    __NuqsAdapterContext?: typeof context
  }
}

if (debugEnabled && typeof window !== 'undefined') {
  // Optional: warn if multiple instances are detected in development
  if (window.__NuqsAdapterContext && window.__NuqsAdapterContext !== context) {
    console.error(error(303))
  }
  window.__NuqsAdapterContext = context
}

/**
 * Set a custom adapter for Nuqs to integrate with your framework/router.
 * @param useAdapter - Hook or function that returns adapter logic
 */
export function createAdapterProvider(useAdapter: UseAdapterHook) {
  context.set({ useAdapter })

  return ({ children, ...props }: { children: ReactNode }) =>
    createElement(Fragment, { ...props }, children)
}

// Accessor for use within components
export function useAdapter() {
  const { useAdapter } = context.get()
  if (!useAdapter) {
    throw new Error(error(404))
  }
  return useAdapter()
}
