import { testBasicIO } from 'e2e-shared/specs/basic-io.spec.ts'

testBasicIO({
  hook: 'useQueryState',
  path: '/app/agnostic/basic-io',
  router: 'next-app',
  description: 'Agnostic adapter'
})

testBasicIO({
  hook: 'useQueryState',
  path: '/pages/agnostic/basic-io',
  router: 'next-pages',
  description: 'Agnostic adapter'
})
