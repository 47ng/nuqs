import { testRepro1099 } from 'e2e-shared/specs/repro-1099.spec.ts'

testRepro1099({
  path: '/app/repro-1099/useQueryState',
  hook: 'useQueryState',
  router: 'next-app'
})

testRepro1099({
  path: '/app/repro-1099/useQueryStates',
  hook: 'useQueryStates',
  router: 'next-app'
})

testRepro1099({
  path: '/pages/repro-1099/useQueryState',
  hook: 'useQueryState',
  router: 'next-pages'
})

testRepro1099({
  path: '/pages/repro-1099/useQueryStates',
  hook: 'useQueryStates',
  router: 'next-pages'
})
