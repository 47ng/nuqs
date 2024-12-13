import { testLinking } from 'e2e-shared/cypress/e2e/linking.cy'

testLinking({
  hook: 'useQueryState',
  path: '/linking/useQueryState'
})

testLinking({
  hook: 'useQueryStates',
  path: '/linking/useQueryStates'
})
