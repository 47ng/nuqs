import { useNavigate, useSearchParams } from 'react-router'
import { createReactRouterBasedAdapter } from '../lib/react-router'

export const { NuqsAdapter, useOptimisticSearchParams } =
  createReactRouterBasedAdapter({
    adapter: 'react-router-v7',
    useNavigate,
    useSearchParams
  })
