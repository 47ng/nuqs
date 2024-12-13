import { testLinking } from 'e2e-shared/cypress/e2e/linking.cy'

testLinking({
  hook: 'useQueryState',
  path: '/app/linking/useQueryState',
  nextJsRouter: 'app'
})

testLinking({
  hook: 'useQueryStates',
  path: '/app/linking/useQueryStates',
  nextJsRouter: 'app'
})

testLinking({
  hook: 'useQueryState',
  path: '/pages/linking/useQueryState',
  nextJsRouter: 'pages'
})

testLinking({
  hook: 'useQueryStates',
  path: '/pages/linking/useQueryStates',
  nextJsRouter: 'pages'
})
