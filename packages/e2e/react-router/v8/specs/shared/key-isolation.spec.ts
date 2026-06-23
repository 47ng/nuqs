import { testKeyIsolation } from 'e2e-shared/specs/key-isolation.spec.ts'

testKeyIsolation({
  path: '/key-isolation/useQueryState',
  hook: 'useQueryState'
})

testKeyIsolation({
  path: '/key-isolation/useQueryStates',
  hook: 'useQueryStates'
})
