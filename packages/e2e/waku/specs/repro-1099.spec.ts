import { testRepro1099 } from 'e2e-shared/specs/repro-1099.spec.ts'

testRepro1099({
  path: `${''}/repro-1099/useQueryState`,
  hook: 'useQueryState',
  router: 'waku',
  description: 'static'
})

testRepro1099({
  path: `${'/dynamic'}/repro-1099/useQueryState`,
  hook: 'useQueryState',
  router: 'waku',
  description: 'dynamic'
})

testRepro1099({
  path: `${''}/repro-1099/useQueryStates`,
  hook: 'useQueryStates',
  router: 'waku',
  description: 'static'
})

testRepro1099({
  path: `${'/dynamic'}/repro-1099/useQueryStates`,
  hook: 'useQueryStates',
  router: 'waku',
  description: 'dynamic'
})
