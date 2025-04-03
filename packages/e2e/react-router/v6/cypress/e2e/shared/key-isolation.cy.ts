import { testKeyIsolation } from 'e2e-shared/specs/key-isolation.cy'

testKeyIsolation({
  path: '/key-isolation/useQueryState',
  hook: 'useQueryState'
})

testKeyIsolation({
  path: '/key-isolation/useQueryStates',
  hook: 'useQueryStates'
})
