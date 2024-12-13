import {
  type RouteConfig,
  index,
  layout,
  route
} from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  layout('layout.tsx', [
    route('/hash-preservation', 'routes/hash-preservation.tsx'),
    route('/basic-io/useQueryState', './routes/basic-io.useQueryState.tsx'),
    route('/basic-io/useQueryStates', 'routes/basic-io.useQueryStates.tsx')
  ])
] satisfies RouteConfig
