import { type RouteConfig, layout, route } from '@react-router/dev/routes'

export default [
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
    route('/routing/useQueryState',         './routes/routing.useQueryState.tsx'),
    route('/routing/useQueryState/other',   './routes/routing.useQueryState.other.tsx'),
    route('/routing/useQueryStates',        './routes/routing.useQueryStates.tsx'),
    route('/routing/useQueryStates/other',  './routes/routing.useQueryStates.other.tsx'),
    route('/shallow/useQueryState',         './routes/shallow.useQueryState.tsx'),
    route('/shallow/useQueryStates',        './routes/shallow.useQueryStates.tsx'),
    route('/loader',                        './routes/loader.tsx')
  ])
] satisfies RouteConfig
