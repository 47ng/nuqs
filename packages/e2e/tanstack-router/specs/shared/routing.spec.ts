import { testRouting } from 'e2e-shared/specs/routing.spec.ts'

testRouting({
  path: '/routing/useQueryState',
  hook: 'useQueryState'
})

testRouting({
  path: '/routing/useQueryStates',
  hook: 'useQueryStates'
})
