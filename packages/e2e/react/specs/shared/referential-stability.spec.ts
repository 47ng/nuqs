import { testReferentialStability } from 'e2e-shared/specs/referential-stability.spec.ts'

testReferentialStability({
  path: '/referential-stability/useQueryState',
  hook: 'useQueryState'
})

testReferentialStability({
  path: '/referential-stability/useQueryStates',
  hook: 'useQueryStates'
})
