import { testReferentialStability } from 'e2e-shared/specs/referential-stability.cy'

testReferentialStability({
  path: '/app/referential-stability/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app'
})

testReferentialStability({
  path: '/app/referential-stability/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app'
})

testReferentialStability({
  path: '/pages/referential-stability/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages'
})

testReferentialStability({
  path: '/pages/referential-stability/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages'
})
