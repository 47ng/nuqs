import { testBasicIO } from 'e2e-shared/specs/basic-io.cy'

testBasicIO({
  hook: 'useQueryState',
  path: '/basic-io/useQueryState'
})

testBasicIO({
  hook: 'useQueryStates',
  path: '/basic-io/useQueryStates'
})
