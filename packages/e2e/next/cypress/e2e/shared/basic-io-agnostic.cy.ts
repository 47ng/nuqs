import { testBasicIO } from 'e2e-shared/specs/basic-io.cy'

testBasicIO({
  hook: 'useQueryState',
  path: '/app/agnostic/basic-io',
  nextJsRouter: 'app',
  description: 'Agnostic adapter'
})

testBasicIO({
  hook: 'useQueryState',
  path: '/pages/agnostic/basic-io',
  nextJsRouter: 'pages',
  description: 'Agnostic adapter'
})
