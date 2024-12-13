import { basicIO } from 'e2e-shared/cypress/e2e/basic-io.cy'

basicIO({
  hook: 'useQueryState',
  path: '/basic-io/useQueryState'
})

basicIO({
  hook: 'useQueryStates',
  path: '/basic-io/useQueryStates'
})
