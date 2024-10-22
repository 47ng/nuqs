import { createContext, createElement, useContext, type ReactNode } from 'react'
import { error } from '../errors'
import type { UseAdapterHook } from './defs'

export type AdapterContext = {
  useAdapter: UseAdapterHook
}

export const context = createContext<AdapterContext>({
  useAdapter() {
    throw new Error(error(404))
  }
})
context.displayName = 'NuqsAdapterContext'

export function createAdapterProvider(useAdapter: UseAdapterHook) {
  return ({ children, ...props }: { children: ReactNode }) =>
    createElement(
      context.Provider,
      { ...props, value: { useAdapter } },
      children
    )
}

export function useAdapter() {
  const value = useContext(context)
  if (!('useAdapter' in value)) {
    throw new Error(error(404))
  }
  return value.useAdapter()
}
