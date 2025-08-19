import { testConditionalRendering } from 'e2e-shared/specs/conditional-rendering.cy'

testConditionalRendering({
  path: '/conditional-rendering/useQueryState',
  hook: 'useQueryState'
})

testConditionalRendering({
  path: '/conditional-rendering/useQueryStates',
  hook: 'useQueryStates'
})
