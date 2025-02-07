import { useNavigate, useSearchParams } from 'react-router-dom'
import { createReactRouterBasedAdapter } from '../lib/react-router'

export const { NuqsAdapter, useOptimisticSearchParams } =
  createReactRouterBasedAdapter({
    adapter: 'react-router-v6',
    useNavigate,
    useSearchParams
  })
