import { testRepro1099 } from 'e2e-shared/specs/repro-1099.cy'

testRepro1099({
  path: '/repro-1099/useQueryState',
  hook: 'useQueryState'
})

testRepro1099({
  path: '/repro-1099/useQueryStates',
  hook: 'useQueryStates'
})
