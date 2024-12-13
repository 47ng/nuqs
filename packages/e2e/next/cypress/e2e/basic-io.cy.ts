import { basicIO } from 'e2e-shared/cypress/e2e/basic-io.cy'

basicIO({
  hook: 'useQueryState',
  path: '/app/basic-io/useQueryState',
  description: 'app router'
})

basicIO({
  hook: 'useQueryStates',
  path: '/app/basic-io/useQueryStates',
  description: 'app router'
})

basicIO({
  hook: 'useQueryState',
  path: '/pages/basic-io/useQueryState',
  description: 'pages router'
})

basicIO({
  hook: 'useQueryStates',
  path: '/pages/basic-io/useQueryStates',
  description: 'pages router'
})
