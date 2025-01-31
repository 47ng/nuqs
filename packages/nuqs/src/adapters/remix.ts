import { useNavigate, useSearchParams } from '@remix-run/react'
import { createReactRouterBasedAdapter } from './lib/react-router'

export const { NuqsAdapter, useOptimisticSearchParams } =
  createReactRouterBasedAdapter({
    adapter: 'remix',
    useNavigate,
    useSearchParams
  })
