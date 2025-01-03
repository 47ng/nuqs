import { type RouteConfig, layout, route } from '@react-router/dev/routes'

export default [
  // prettier-ignore
  layout('layout.tsx', [
    // Shared E2E tests
    route('/hash-preservation',                     './routes/hash-preservation.tsx'),
    route('/basic-io/useQueryState',                './routes/basic-io.useQueryState.tsx'),
    route('/basic-io/useQueryStates',               './routes/basic-io.useQueryStates.tsx'),
    route('/linking/useQueryState',                 './routes/linking.useQueryState.tsx'),
    route('/linking/useQueryState/other',           './routes/linking.useQueryState.other.tsx'),
    route('/linking/useQueryStates',                './routes/linking.useQueryStates.tsx'),
    route('/linking/useQueryStates/other',          './routes/linking.useQueryStates.other.tsx'),
    route('/push/useQueryState',                    './routes/push.useQueryState.tsx'),
    route('/push/useQueryStates',                   './routes/push.useQueryStates.tsx'),
    route('/routing/useQueryState',                 './routes/routing.useQueryState.tsx'),
    route('/routing/useQueryState/other',           './routes/routing.useQueryState.other.tsx'),
    route('/routing/useQueryStates',                './routes/routing.useQueryStates.tsx'),
    route('/routing/useQueryStates/other',          './routes/routing.useQueryStates.other.tsx'),
    route('/shallow/useQueryState',                 './routes/shallow.useQueryState.tsx'),
    route('/shallow/useQueryStates',                './routes/shallow.useQueryStates.tsx'),
    route('/loader',                                './routes/loader.tsx'),
    route('/form/useQueryState',                    './routes/form.useQueryState.tsx'),
    route('/form/useQueryStates',                   './routes/form.useQueryStates.tsx'),
    route('/referential-stability/useQueryState',   './routes/referential-stability.useQueryState.tsx'),
    route('/referential-stability/useQueryStates',  './routes/referential-stability.useQueryStates.tsx'),
    // Reproductions
    route('/repro-839',   './routes/repro-839.tsx'),
  ])
] satisfies RouteConfig
