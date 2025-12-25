import { testConditionalRendering } from 'e2e-shared/specs/conditional-rendering.spec.ts'

testConditionalRendering({
  hook: 'useQueryState',
  path: '/conditional-rendering/useQueryState'
})

testConditionalRendering({
  hook: 'useQueryStates',
  path: '/conditional-rendering/useQueryStates'
})
