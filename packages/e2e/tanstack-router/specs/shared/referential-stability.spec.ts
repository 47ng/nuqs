import { testReferentialStability } from 'e2e-shared/specs/referential-stability.spec.ts'

testReferentialStability({
  hook: 'useQueryState',
  path: '/referential-stability/useQueryState'
})

testReferentialStability({
  hook: 'useQueryStates',
  path: '/referential-stability/useQueryStates'
})
