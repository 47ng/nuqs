import { map } from 'nanostores'
import { createElement, Fragment, type ReactNode } from 'react'
import { debugEnabled } from '../../debug'
import { error } from '../../errors'
import type { UseAdapterHook } from './defs'

export type AdapterContext = {
  useAdapter: UseAdapterHook
}

export const context = map<AdapterContext>({
  useAdapter() {
    throw new Error(error(404))
  }
})

declare global {
  interface Window {
    __NuqsAdapterContext?: typeof context
  }
}

if (debugEnabled && typeof window !== 'undefined') {
  if (window.__NuqsAdapterContext && window.__NuqsAdapterContext !== context) {
    console.error(error(303))
  }
  window.__NuqsAdapterContext = context
}

/**
 * Create a custom adapter (context provider) for nuqs to work with your framework / router.
 *
 * Adapters are based on React Context,
 *
 * @param useAdapter
 * @returns
 */
export function createAdapterProvider(useAdapter: UseAdapterHook) {
  context.setKey('useAdapter', useAdapter)

  return ({ children, ...props }: { children: ReactNode }) =>
    createElement(Fragment, { ...props }, children)
}

export function useAdapter() {
  const value = context.get()
  if (!('useAdapter' in value)) {
    throw new Error(error(404))
  }
  return value.useAdapter()
}
