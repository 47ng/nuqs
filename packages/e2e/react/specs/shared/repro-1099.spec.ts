import { testRepro1099 } from 'e2e-shared/specs/repro-1099.spec.ts'

testRepro1099({
  path: '/repro-1099/useQueryState',
  hook: 'useQueryState',
  shallowOptions: [true]
})

testRepro1099({
  path: '/repro-1099/useQueryStates',
  hook: 'useQueryStates',
  shallowOptions: [true]
})
