import {
  type RouteConfig,
  index,
  layout,
  route
} from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  // prettier-ignore
  layout('layout.tsx', [
    route('/hash-preservation',             './routes/hash-preservation.tsx'),
    route('/basic-io/useQueryState',        './routes/basic-io.useQueryState.tsx'),
    route('/basic-io/useQueryStates',       './routes/basic-io.useQueryStates.tsx'),
    route('/linking/useQueryState',         './routes/linking.useQueryState.tsx'),
    route('/linking/useQueryState/other',   './routes/linking.useQueryState.other.tsx'),
    route('/linking/useQueryStates',        './routes/linking.useQueryStates.tsx'),
    route('/linking/useQueryStates/other',  './routes/linking.useQueryStates.other.tsx'),
    route('/push/useQueryState',            './routes/push.useQueryState.tsx'),
    route('/push/useQueryStates',           './routes/push.useQueryStates.tsx'),
  ])
] satisfies RouteConfig
