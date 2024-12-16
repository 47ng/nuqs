import { testRouting } from 'e2e-shared/specs/routing.cy'

testRouting({
  path: '/routing/useQueryState',
  hook: 'useQueryState',
  shallowOptions: [true, false]
})

testRouting({
  path: '/routing/useQueryStates',
  hook: 'useQueryStates',
  shallowOptions: [true, false]
})
