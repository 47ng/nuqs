import { testRouting } from 'e2e-shared/specs/routing.cy'

testRouting({
  path: '/routing/useQueryState',
  hook: 'useQueryState',
  shallowOptions: [false] // todo: Enable shallow routing
})

testRouting({
  path: '/routing/useQueryStates',
  hook: 'useQueryStates',
  shallowOptions: [false] // todo: Enable shallow routing
})
