import { testRepro1099 } from 'e2e-shared/specs/repro-1099.cy'

testRepro1099({
  path: '/app/repro-1099/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app'
})

testRepro1099({
  path: '/app/repro-1099/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app'
})

testRepro1099({
  path: '/pages/repro-1099/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages'
})

testRepro1099({
  path: '/pages/repro-1099/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages'
})
