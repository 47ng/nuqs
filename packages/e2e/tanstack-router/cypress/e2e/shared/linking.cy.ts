import { testLinking } from 'e2e-shared/specs/linking.cy'

testLinking({
  hook: 'useQueryState',
  path: '/linking/useQueryState'
})

testLinking({
  hook: 'useQueryStates',
  path: '/linking/useQueryStates'
})
