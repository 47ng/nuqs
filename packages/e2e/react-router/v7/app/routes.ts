import { type RouteConfig, layout, route } from '@react-router/dev/routes'

export default [
  // prettier-ignore
  layout('layout.tsx', [
    // Shared E2E tests
    route('/basic-io/useQueryState',                    './routes/basic-io.useQueryState.tsx'),
    route('/basic-io/useQueryStates',                   './routes/basic-io.useQueryStates.tsx'),
    route('/conditional-rendering/useQueryState',       './routes/conditional-rendering.useQueryState.tsx'),
    route('/conditional-rendering/useQueryStates',      './routes/conditional-rendering.useQueryStates.tsx'),
    route('/form/useQueryState',                        './routes/form.useQueryState.tsx'),
    route('/form/useQueryStates',                       './routes/form.useQueryStates.tsx'),
    route('/hash-preservation',                         './routes/hash-preservation.tsx'),
    route('/json',                                      './routes/json.tsx'),
    route('/life-and-death',                            './routes/life-and-death.tsx'),
    route('/linking/useQueryState',                     './routes/linking.useQueryState.tsx'),
    route('/linking/useQueryState/other',               './routes/linking.useQueryState.other.tsx'),
    route('/linking/useQueryStates',                    './routes/linking.useQueryStates.tsx'),
    route('/linking/useQueryStates/other',              './routes/linking.useQueryStates.other.tsx'),
    route('/pretty-urls',                               './routes/pretty-urls.tsx'),
    route('/referential-stability/useQueryState',       './routes/referential-stability.useQueryState.tsx'),
    route('/referential-stability/useQueryStates',      './routes/referential-stability.useQueryStates.tsx'),
    route('/routing/useQueryState',                     './routes/routing.useQueryState.tsx'),
    route('/routing/useQueryState/other',               './routes/routing.useQueryState.other.tsx'),
    route('/routing/useQueryStates',                    './routes/routing.useQueryStates.tsx'),
    route('/routing/useQueryStates/other',              './routes/routing.useQueryStates.other.tsx'),
    route('/scroll',                                    './routes/scroll.tsx'),

    // Local tests
    route('/debounce',                                  './routes/debounce.tsx'),
    route('/debounce/other',                            './routes/debounce.other.tsx'),
    route('/dynamic-segments/catch-all?/*',             './routes/dynamic-segments.catch-all.$.tsx'),
    route('/dynamic-segments/dynamic/:segment',         './routes/dynamic-segments.dynamic.$segment.tsx'),
    route('/flush-after-navigate/useQueryState/end',    './routes/flush-after-navigate.useQueryState.end.tsx'),
    route('/flush-after-navigate/useQueryState/start',  './routes/flush-after-navigate.useQueryState.start.tsx'),
    route('/flush-after-navigate/useQueryStates/end',   './routes/flush-after-navigate.useQueryStates.end.tsx'),
    route('/flush-after-navigate/useQueryStates/start', './routes/flush-after-navigate.useQueryStates.start.tsx'),
    route('/fog-of-war',                                './routes/fog-of-war._index.tsx'),
    route('/fog-of-war/result',                         './routes/fog-of-war.result.tsx'),
    route('/loader',                                    './routes/loader.tsx'),
    route('/push/useQueryState',                        './routes/push.useQueryState.tsx'),
    route('/push/useQueryStates',                       './routes/push.useQueryStates.tsx'),
    route('/rate-limits',                               './routes/rate-limits.tsx'),
    route('/shallow/useQueryState',                     './routes/shallow.useQueryState.tsx'),
    route('/shallow/useQueryStates',                    './routes/shallow.useQueryStates.tsx'),
    route('/stitching',                                 './routes/stitching.tsx'),

    // Render count
    route('/render-count/:hook/:shallow/:history/:startTransition/no-loader',    './routes/render-count.$hook.$shallow.$history.$startTransition.no-loader.tsx'),
    route('/render-count/:hook/:shallow/:history/:startTransition/sync-loader',  './routes/render-count.$hook.$shallow.$history.$startTransition.sync-loader.tsx'),
    route('/render-count/:hook/:shallow/:history/:startTransition/async-loader', './routes/render-count.$hook.$shallow.$history.$startTransition.async-loader.tsx'),

    // Reproductions
    route('/repro-359', './routes/repro-359.tsx'),
    route('/repro-839', './routes/repro-839.tsx'),
    route('/repro-982', './routes/repro-982.tsx'),
  ])
] satisfies RouteConfig
