import { testConditionalRendering } from 'e2e-shared/specs/conditional-rendering.cy'

testConditionalRendering({
  path: '/app/conditional-rendering/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app'
})

testConditionalRendering({
  path: '/app/conditional-rendering/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app'
})

testConditionalRendering({
  path: '/pages/conditional-rendering/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages'
})

testConditionalRendering({
  path: '/pages/conditional-rendering/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages'
})
