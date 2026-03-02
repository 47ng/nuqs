import { testLinking } from 'e2e-shared/specs/linking.spec.ts'

testLinking({
  hook: 'useQueryState',
  path: '/linking/useQueryState'
})

testLinking({
  hook: 'useQueryStates',
  path: '/linking/useQueryStates'
})
